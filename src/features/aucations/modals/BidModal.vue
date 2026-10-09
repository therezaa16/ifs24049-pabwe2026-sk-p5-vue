<template>
  <div
    v-if="show && aucation"
    data-testid="bid-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bid-modal-heading"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h2 id="bid-modal-heading" class="text-base font-bold text-slate-800">Ajukan Penawaran</h2>
        <button
          type="button"
          data-testid="close-bid-modal-btn"
          aria-label="Tutup"
          @click="onClose"
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-6 space-y-4">
        <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 space-y-1">
          <p class="font-semibold text-slate-900">{{ aucation.title }}</p>
          <p>
            Harga awal:
            <span data-testid="bid-start-price" class="font-semibold">{{ formatRupiah(aucation.start_bid) }}</span>
          </p>
          <p>
            Tawaran tertinggi:
            <span data-testid="bid-highest-price" class="font-semibold">
              {{ highest === null ? "Belum ada" : formatRupiah(highest) }}
            </span>
          </p>
        </div>

        <div>
          <label for="bid-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Nominal Penawaran (Rupiah)
          </label>
          <input
            id="bid-input"
            type="number"
            data-testid="bid-input"
            v-model="bid"
            :min="minBid"
            :placeholder="`Minimal ${minBid}`"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
          />
          <p class="text-xs text-slate-600 mt-1.5">
            Penawaran minimal {{ formatRupiah(minBid) }}.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            data-testid="cancel-bid-modal-btn"
            @click="onClose"
            :disabled="loading"
            class="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-bid-modal-btn"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all disabled:opacity-60"
          >
            <template v-if="loading">
              <Loader2 :size="18" class="animate-spin" aria-hidden="true" />
              <span>Mengirim...</span>
            </template>
            <template v-else>
              <HandCoins :size="18" aria-hidden="true" />
              <span>Ajukan Bid</span>
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { X, Loader2, HandCoins } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { formatRupiah, getHighestBid, showErrorDialog } from "../../../helpers/toolsHelper";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  aucation: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "saved"]);

const aucationsStore = useAucationsStore();

const loading = ref(false);
const bid = ref("");

const highest = computed(() => getHighestBid(props.aucation?.bids));
const minBid = computed(() =>
  highest.value === null ? Number(props.aucation?.start_bid) : highest.value + 1
);

function onClose() {
  emit("close");
}

watch(
  () => props.show,
  (newShow) => {
    document.body.style.overflow = newShow ? "hidden" : "auto";
    if (newShow) bid.value = "";
  }
);

watch(
  () => [aucationsStore.isBidAdd, aucationsStore.isBidAdded],
  ([isBidAdd, isBidAdded]) => {
    if (isBidAdd) {
      loading.value = false;
      aucationsStore.setIsBidAdd(false);
      if (isBidAdded) {
        aucationsStore.setIsBidAdded(false);
        emit("saved");
        onClose();
      }
    }
  }
);

function handleSave() {
  if (!(Number(bid.value) >= minBid.value)) {
    showErrorDialog(`Penawaran minimal ${formatRupiah(minBid.value)}`);
    return;
  }

  loading.value = true;
  aucationsStore.asyncSetIsBidAdd(props.aucation.id, Number(bid.value));
}
</script>

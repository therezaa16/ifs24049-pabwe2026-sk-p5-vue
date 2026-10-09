<template>
  <div
    v-if="show"
    data-testid="change-aucation-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="change-aucation-title-heading"
    class="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto"
  >
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
          <Edit3 :size="18" :stroke-width="2.5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="change-aucation-title-heading" class="text-base font-bold text-slate-800">Ubah Lelang</h2>
          <p class="text-xs text-slate-600">Perbarui data lelang yang sudah ada</p>
        </div>
      </div>
      <button
        type="button"
        data-testid="close-change-modal-btn"
        aria-label="Tutup"
        @click="onClose"
        class="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
      >
        <X :size="20" aria-hidden="true" />
      </button>
    </div>

    <form @submit.prevent="handleSave" class="flex-1 flex flex-col bg-white">
      <div class="flex-1 p-6 md:p-8 space-y-5 w-full max-w-4xl mx-auto">
        <div>
          <label for="change-aucation-title" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Lelang <span class="text-red-700" aria-hidden="true">*</span>
          </label>
          <input
            id="change-aucation-title"
            type="text"
            data-testid="change-aucation-title-input"
            v-model="title"
            placeholder="Contoh: Keyboard Gaming RGB"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="change-aucation-start-bid" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Harga Awal (Rupiah) <span class="text-red-700" aria-hidden="true">*</span>
            </label>
            <input
              id="change-aucation-start-bid"
              type="number"
              min="1"
              data-testid="change-aucation-start-bid-input"
              v-model="startBid"
              placeholder="Contoh: 200000"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
            />
          </div>
          <div>
            <label for="change-aucation-closed-at" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Batas Waktu Penutupan <span class="text-red-700" aria-hidden="true">*</span>
            </label>
            <input
              id="change-aucation-closed-at"
              type="datetime-local"
              data-testid="change-aucation-closed-at-input"
              v-model="closedAt"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
            />
          </div>
        </div>

        <div>
          <p id="change-aucation-description-label" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Deskripsi (Markdown) <span class="text-red-700" aria-hidden="true">*</span>
          </p>
          <div class="min-h-[300px]">
            <MarkdownEditor
              v-model="description"
              placeholder="Tuliskan spesifikasi dan kondisi barang dalam format Markdown..."
              height="300px"
              textarea-test-id="change-aucation-description-input"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          data-testid="cancel-change-modal-btn"
          @click="onClose"
          :disabled="loading"
          class="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          data-testid="submit-change-modal-btn"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md shadow-teal-700/25 transition-all disabled:opacity-60"
        >
          <template v-if="loading">
            <Loader2 :size="18" class="animate-spin" aria-hidden="true" />
            <span>Menyimpan...</span>
          </template>
          <template v-else>
            <Edit3 :size="18" :stroke-width="2.5" aria-hidden="true" />
            <span>Perbarui Lelang</span>
          </template>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { Edit3, X, Loader2 } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { showErrorDialog, toApiDateTime, toLocalInput } from "../../../helpers/toolsHelper";
import MarkdownEditor from "../components/MarkdownEditor.vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  aucationId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["close", "saved"]);

const aucationsStore = useAucationsStore();

const loading = ref(false);
const title = ref("");
const description = ref("");
const startBid = ref("");
const closedAt = ref("");

function onClose() {
  emit("close");
}

function syncAucation() {
  const current = aucationsStore.aucation;
  if (current && props.show) {
    title.value = current.title;
    description.value = current.description;
    startBid.value = current.start_bid;
    closedAt.value = toLocalInput(current.closed_at);
  }
}

watch(
  () => [props.aucationId, props.show],
  ([newId, newShow]) => {
    if (newId && newShow) {
      aucationsStore.asyncSetAucation(newId);
    }
  },
  { immediate: true }
);

watch(() => [aucationsStore.aucation, props.show], syncAucation, {
  immediate: true,
  deep: true,
});

watch(
  () => props.show,
  (newShow) => {
    document.body.style.overflow = newShow ? "hidden" : "auto";
  }
);

watch(
  () => [aucationsStore.isAucationChange, aucationsStore.isAucationChanged],
  ([isAucationChange, isAucationChanged]) => {
    if (isAucationChange) {
      loading.value = false;
      aucationsStore.setIsAucationChange(false);
      if (isAucationChanged) {
        aucationsStore.setIsAucationChanged(false);
        emit("saved");
        onClose();
      }
    }
  }
);

function handleSave() {
  if (!title.value.trim()) {
    showErrorDialog("Judul tidak boleh kosong");
    return;
  }

  if (!description.value.trim()) {
    showErrorDialog("Deskripsi tidak boleh kosong");
    return;
  }

  if (!(Number(startBid.value) > 0)) {
    showErrorDialog("Harga awal harus lebih besar dari 0");
    return;
  }

  if (!closedAt.value) {
    showErrorDialog("Batas waktu penutupan tidak boleh kosong");
    return;
  }

  loading.value = true;
  aucationsStore.asyncSetIsAucationChange(
    props.aucationId,
    title.value.trim(),
    description.value.trim(),
    Number(startBid.value),
    toApiDateTime(closedAt.value)
  );
}
</script>

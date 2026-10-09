<template>
  <div
    v-if="show"
    data-testid="add-aucation-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-aucation-title-heading"
    class="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto"
  >
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
          <Plus :size="18" :stroke-width="2.5" aria-hidden="true" />
        </div>
        <div>
          <h2 id="add-aucation-title-heading" class="text-base font-bold text-slate-800">Tambah Lelang Baru</h2>
          <p class="text-xs text-slate-600">Daftarkan barang yang ingin dilelang</p>
        </div>
      </div>
      <button
        type="button"
        data-testid="close-add-modal-btn"
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
          <label for="add-aucation-title" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Lelang <span class="text-red-700" aria-hidden="true">*</span>
          </label>
          <input
            id="add-aucation-title"
            type="text"
            data-testid="add-aucation-title-input"
            v-model="title"
            placeholder="Contoh: Keyboard Gaming RGB"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label for="add-aucation-start-bid" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Harga Awal (Rupiah) <span class="text-red-700" aria-hidden="true">*</span>
            </label>
            <input
              id="add-aucation-start-bid"
              type="number"
              min="1"
              data-testid="add-aucation-start-bid-input"
              v-model="startBid"
              placeholder="Contoh: 200000"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
            />
          </div>
          <div>
            <label for="add-aucation-closed-at" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Batas Waktu Penutupan <span class="text-red-700" aria-hidden="true">*</span>
            </label>
            <input
              id="add-aucation-closed-at"
              type="datetime-local"
              data-testid="add-aucation-closed-at-input"
              v-model="closedAt"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700 text-sm"
            />
          </div>
        </div>

        <div>
          <p id="add-aucation-description-label" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Deskripsi (Markdown) <span class="text-red-700" aria-hidden="true">*</span>
          </p>
          <div class="min-h-[300px]">
            <MarkdownEditor
              v-model="description"
              placeholder="Tuliskan spesifikasi dan kondisi barang dalam format Markdown..."
              height="300px"
              textarea-test-id="add-aucation-description-input"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          data-testid="cancel-add-modal-btn"
          @click="onClose"
          :disabled="loading"
          class="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          data-testid="submit-add-modal-btn"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md shadow-teal-700/25 transition-all disabled:opacity-60"
        >
          <template v-if="loading">
            <Loader2 :size="18" class="animate-spin" aria-hidden="true" />
            <span>Menyimpan...</span>
          </template>
          <template v-else>
            <Plus :size="18" :stroke-width="2.5" aria-hidden="true" />
            <span>Tambah Lelang</span>
          </template>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, defineAsyncComponent } from "vue";
import { Plus, X, Loader2 } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { showErrorDialog, toApiDateTime } from "../../../helpers/toolsHelper";
const MarkdownEditor = defineAsyncComponent(() => import("../components/MarkdownEditor.vue"));

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
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

function resetForm() {
  title.value = "";
  description.value = "";
  startBid.value = "";
  closedAt.value = "";
}

watch(
  () => props.show,
  (newShow) => {
    document.body.style.overflow = newShow ? "hidden" : "auto";
  }
);

watch(
  () => [aucationsStore.isAucationAdd, aucationsStore.isAucationAdded],
  ([isAucationAdd, isAucationAdded]) => {
    if (isAucationAdd) {
      loading.value = false;
      aucationsStore.setIsAucationAdd(false);
      if (isAucationAdded) {
        aucationsStore.setIsAucationAdded(false);
        resetForm();
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
  aucationsStore.asyncSetIsAucationAdd(
    title.value.trim(),
    description.value.trim(),
    Number(startBid.value),
    toApiDateTime(closedAt.value)
  );
}
</script>

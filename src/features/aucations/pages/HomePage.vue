<template>
  <div v-if="profile" class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Lelang</h1>
        <p class="text-sm text-slate-600 mt-1">
          Temukan barang lelang, pantau penawaran, atau buka lelang Anda sendiri.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          data-testid="delete-all-aucations-btn"
          @click="handleDeleteAll"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
        >
          <Trash2 :size="18" aria-hidden="true" />
          <span>Hapus Semua Lelang Saya</span>
        </button>
        <button
          type="button"
          data-testid="add-aucation-btn"
          @click="showAddModal = true"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-teal-700 hover:bg-teal-800 shadow-md shadow-teal-700/25 transition-all"
        >
          <Plus :size="18" :stroke-width="2.5" aria-hidden="true" />
          <span>Tambah Lelang</span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      <fieldset aria-label="Filter lelang" class="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-700">
        <button
          v-for="item in tabs"
          :key="item.key"
          type="button"
          :data-testid="`tab-${item.key}-btn`"
          :aria-pressed="tab === item.key"
          @click="tab = item.key"
          class="px-3 py-1.5 rounded-lg transition-all"
          :class="tab === item.key ? 'bg-white text-teal-900 shadow-xs' : 'hover:text-slate-900'"
        >
          {{ item.label }}
        </button>
      </fieldset>

      <div class="relative max-w-md">
        <label for="search-aucation" class="sr-only">Cari lelang</label>
        <Search :size="18" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          id="search-aucation"
          type="search"
          data-testid="search-aucation-input"
          v-model="searchQuery"
          placeholder="Cari judul atau deskripsi lelang..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-700"
        />
      </div>
    </div>

    <output v-if="loadingAucations && filteredAucations.length === 0" class="py-16 text-center text-slate-600">
      <Loader2 :size="36" class="mx-auto text-teal-700 animate-spin mb-2" aria-hidden="true" />
      <p class="font-medium">Memuat daftar lelang...</p>
    </output>
    <div v-else-if="filteredAucations.length === 0" class="py-16 text-center text-slate-600">
      <Gavel :size="40" class="mx-auto text-slate-500 mb-2" aria-hidden="true" />
      <p class="font-medium">Belum ada lelang yang cocok.</p>
    </div>
    <ul v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <li
        v-for="item in filteredAucations"
        :key="`aucation-${item.id}`"
        :data-testid="`aucation-card-${item.id}`"
        class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
      >
        <div class="h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
          <img v-if="item.cover" :src="item.cover" :alt="item.title" class="w-full h-full object-cover" />
          <Gavel v-else :size="40" class="text-slate-500" aria-hidden="true" />
        </div>

        <div class="p-5 flex-1 flex flex-col gap-3">
          <div class="flex items-start justify-between gap-3">
            <h2 class="font-bold text-slate-900 leading-snug">
              <RouterLink
                :to="`/aucations/${item.id}`"
                :data-testid="`view-aucation-${item.id}`"
                class="hover:text-teal-800 focus:outline-none focus:underline"
              >
                {{ item.title }}
              </RouterLink>
            </h2>
            <span
              :data-testid="`status-${item.id}`"
              class="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
              :class="
                closed(item)
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              "
            >
              {{ closed(item) ? "Ditutup" : "Berlangsung" }}
            </span>
          </div>

          <p v-if="item.description" class="text-sm text-slate-600 line-clamp-2">{{ item.description }}</p>

          <dl class="grid grid-cols-2 gap-3 text-sm mt-auto">
            <div>
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Harga Awal</dt>
              <dd class="font-bold text-slate-900">{{ formatRupiah(item.start_bid) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Tawaran Tertinggi</dt>
              <dd :data-testid="`highest-${item.id}`" class="font-bold text-teal-800">{{ bidSummary(item) }}</dd>
            </div>
          </dl>

          <p :data-testid="`countdown-${item.id}`" class="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <Clock :size="14" aria-hidden="true" />
            {{ formatTimeLeft(item.closed_at, now) }}
          </p>

          <div v-if="isOwner(item)" class="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              :data-testid="`edit-aucation-${item.id}`"
              @click="handleEdit(item.id)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg"
            >
              <Pencil :size="14" aria-hidden="true" /> Ubah
            </button>
            <button
              type="button"
              :data-testid="`delete-aucation-${item.id}`"
              @click="handleDelete(item.id)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-red-50 hover:bg-red-100 rounded-lg"
            >
              <Trash2 :size="14" aria-hidden="true" /> Hapus
            </button>
          </div>
        </div>
      </li>
    </ul>

    <AddModal :show="showAddModal" @close="showAddModal = false" @saved="loadAucations" />
    <ChangeModal
      :show="showChangeModal"
      :aucation-id="selectedAucationId"
      @close="showChangeModal = false"
      @saved="loadAucations"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, RouterLink } from "vue-router";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatRupiah,
  formatTimeLeft,
  getHighestBid,
  isAucationClosed,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import { Plus, Gavel, Clock, Pencil, Trash2, Search, Loader2 } from "lucide-vue-next";

const route = useRoute();
const aucationsStore = useAucationsStore();
const usersStore = useUsersStore();

const tabs = [
  { key: "all", label: "Semua Lelang" },
  { key: "mine", label: "Lelang Saya" },
  { key: "open", label: "Lelang Berlangsung" },
  { key: "closed", label: "Lelang Ditutup" },
];

const profile = computed(() => usersStore.profile);
const aucations = computed(() => aucationsStore.aucations);

const tab = ref(route.query.tab === "mine" ? "mine" : "all");
const searchQuery = ref("");
const loadingAucations = ref(false);
const showAddModal = ref(false);
const showChangeModal = ref(false);
const selectedAucationId = ref(null);
const now = ref(Date.now());

let timer = null;

function closed(item) {
  return isAucationClosed(item.closed_at, now.value);
}

function isOwner(item) {
  return item.user_id === profile.value.id;
}

function bidSummary(item) {
  const highest = getHighestBid(item.bids);
  if (highest !== null) return formatRupiah(highest);
  return item.bids?.length ? `${item.bids.length} penawaran` : "Belum ada";
}

function loadAucations() {
  loadingAucations.value = true;
  return Promise.resolve(
    aucationsStore.asyncSetAucations(tab.value === "mine" ? { is_me: 1 } : {})
  ).finally(() => {
    loadingAucations.value = false;
  });
}

onMounted(() => {
  loadAucations();
  timer = setInterval(() => {
    now.value = Date.now();
  }, 30000);
});

onBeforeUnmount(() => {
  clearInterval(timer);
});

watch(
  () => route.query.tab,
  (queryTab) => {
    tab.value = queryTab === "mine" ? "mine" : "all";
  }
);

watch(tab, loadAucations);

watch(
  () => aucationsStore.isAucationDeleted,
  (deleted) => {
    if (deleted) {
      aucationsStore.setIsAucationDeleted(false);
      loadAucations();
    }
  }
);

watch(
  () => aucationsStore.isAucationDeletedAll,
  (deleted) => {
    if (deleted) {
      aucationsStore.setIsAucationDeletedAll(false);
      loadAucations();
    }
  }
);

const filteredAucations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return aucations.value.filter((item) => {
    if (tab.value === "open" && closed(item)) return false;
    if (tab.value === "closed" && !closed(item)) return false;
    if (!query) return true;
    return (
      (item.title || "").toLowerCase().includes(query) ||
      (item.description || "").toLowerCase().includes(query)
    );
  });
});

function handleEdit(aucationId) {
  selectedAucationId.value = aucationId;
  showChangeModal.value = true;
}

async function handleDelete(aucationId) {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus lelang ini?");
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsAucationDelete(aucationId);
  }
}

async function handleDeleteAll() {
  const result = await showConfirmDialog(
    "Apakah Anda yakin ingin menghapus SELURUH lelang milik Anda? Tindakan ini tidak dapat dibatalkan."
  );
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsAucationDeleteAll();
  }
}
</script>

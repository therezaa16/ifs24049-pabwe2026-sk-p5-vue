<template>
  <output v-if="!profile || !aucation" class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
    <span class="sr-only">Memuat detail lelang...</span>
  </output>

  <div v-else class="space-y-6 max-w-4xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <RouterLink
        to="/"
        data-testid="back-to-aucations-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-teal-800 transition-colors"
      >
        <ArrowLeft :size="18" aria-hidden="true" />
        Kembali ke Lelang
      </RouterLink>

      <div v-if="isOwner" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="edit-cover-btn"
          @click="showCoverModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors"
        >
          <ImagePlus :size="16" aria-hidden="true" /> Ubah Cover
        </button>
        <button
          type="button"
          data-testid="edit-detail-aucation-btn"
          @click="showEditModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
        >
          <Edit3 :size="16" aria-hidden="true" /> Ubah Data
        </button>
        <button
          type="button"
          data-testid="delete-detail-aucation-btn"
          @click="handleDelete"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        >
          <Trash2 :size="16" aria-hidden="true" /> Hapus
        </button>
      </div>
    </div>

    <article class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div v-if="aucation.cover" class="w-full h-64 sm:h-80 bg-slate-900 overflow-hidden">
        <img :src="aucation.cover" :alt="aucation.title" class="w-full h-full object-cover" />
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <span
              data-testid="detail-status"
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
              :class="
                isClosed
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              "
            >
              {{ isClosed ? "Ditutup" : "Berlangsung" }}
            </span>
            <span data-testid="detail-time-left" class="text-xs font-medium text-slate-700">
              {{ formatTimeLeft(aucation.closed_at) }}
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{{ aucation.title }}</h1>
          <p v-if="aucation.author" class="text-sm text-slate-600">
            Dilelang oleh <strong class="text-slate-800">{{ aucation.author.name }}</strong>
          </p>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Harga Awal</dt>
            <dd data-testid="detail-start-bid" class="mt-1 font-bold text-slate-900">{{ formatRupiah(aucation.start_bid) }}</dd>
          </div>
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Tawaran Tertinggi</dt>
            <dd data-testid="detail-highest-bid" class="mt-1 font-bold text-teal-800">
              {{ highestBid === null ? "Belum ada" : formatRupiah(highestBid) }}
            </dd>
          </div>
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Ditutup Pada</dt>
            <dd class="mt-1 text-slate-900">{{ formatDate(aucation.closed_at) }}</dd>
          </div>
        </dl>

        <section aria-labelledby="description-heading">
          <h2 id="description-heading" class="text-sm font-bold text-slate-800 mb-2">Deskripsi</h2>
          <div
            data-testid="aucation-detail-description"
            class="bg-slate-50 p-6 rounded-2xl border border-slate-200 leading-relaxed"
          >
            <MarkdownViewer v-if="aucation.description" :content="aucation.description" />
            <p v-else class="italic text-slate-600">Tidak ada deskripsi rinci untuk lelang ini.</p>
          </div>
        </section>

        <section v-if="!isOwner" aria-labelledby="my-bid-heading" class="rounded-2xl border border-teal-200 bg-teal-50 p-5 space-y-3">
          <h2 id="my-bid-heading" class="text-sm font-bold text-teal-950">Penawaran Saya</h2>
          <p v-if="aucation.my_bid" data-testid="my-bid-value" class="text-lg font-black text-teal-900">
            {{ formatRupiah(aucation.my_bid.bid) }}
          </p>
          <p v-else class="text-sm text-slate-700">Anda belum mengajukan penawaran.</p>

          <div v-if="!isClosed" class="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="open-bid-btn"
              @click="showBidModal = true"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
            >
              <HandCoins :size="16" aria-hidden="true" /> Ajukan Penawaran
            </button>
            <button
              v-if="aucation.my_bid"
              type="button"
              data-testid="delete-bid-btn"
              @click="handleDeleteBid"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-800 bg-white hover:bg-red-50 border border-red-200 rounded-xl"
            >
              <Trash2 :size="16" aria-hidden="true" /> Batalkan Tawaran
            </button>
          </div>
        </section>

        <section aria-labelledby="bids-heading">
          <h2 id="bids-heading" class="text-sm font-bold text-slate-800 mb-2">Riwayat Penawaran</h2>
          <p v-if="sortedBids.length === 0" data-testid="no-bids" class="text-sm text-slate-600">
            Belum ada penawaran untuk lelang ini.
          </p>
          <ol v-else class="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
            <li
              v-for="item in sortedBids"
              :key="`bid-${item.id}`"
              :data-testid="`bid-item-${item.id}`"
              class="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span class="font-bold text-slate-900">{{ formatRupiah(item.bid) }}</span>
              <span class="text-xs text-slate-600">{{ formatDate(item.created_at) }}</span>
            </li>
          </ol>
        </section>
      </div>
    </article>

    <ChangeCoverModal :show="showCoverModal" :aucation="aucation" @close="showCoverModal = false" />
    <ChangeModal
      :show="showEditModal"
      :aucation-id="aucation.id"
      @close="showEditModal = false"
      @saved="reloadAucation"
    />
    <BidModal :show="showBidModal" :aucation="aucation" @close="showBidModal = false" @saved="reloadAucation" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import ChangeCoverModal from "../modals/ChangeCoverModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import BidModal from "../modals/BidModal.vue";
const MarkdownViewer = defineAsyncComponent(() => import("../components/MarkdownViewer.vue"));
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatDate,
  formatRupiah,
  formatTimeLeft,
  getHighestBid,
  isAucationClosed,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import { ArrowLeft, ImagePlus, Edit3, Trash2, HandCoins } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const aucationsStore = useAucationsStore();
const usersStore = useUsersStore();

const aucationId = computed(() => route.params.aucationId);
const profile = computed(() => usersStore.profile);
const aucation = computed(() => aucationsStore.aucation);

const showCoverModal = ref(false);
const showEditModal = ref(false);
const showBidModal = ref(false);

const isOwner = computed(() => aucation.value.user_id === profile.value.id);
const isClosed = computed(() => isAucationClosed(aucation.value.closed_at));
const bidList = computed(() => (aucation.value.bids || []).filter((item) => item && typeof item === "object"));
const highestBid = computed(() => getHighestBid(bidList.value));
const sortedBids = computed(() => [...bidList.value].sort((a, b) => Number(b.bid) - Number(a.bid)));

function reloadAucation() {
  aucationsStore.asyncSetAucation(aucationId.value);
}

onMounted(() => {
  reloadAucation();
});

watch(aucationId, (newId) => {
  if (newId) {
    aucationsStore.asyncSetAucation(newId);
  }
});

watch(
  () => [aucationsStore.isAucation, aucationsStore.aucation],
  ([isAucation, current]) => {
    if (isAucation) {
      aucationsStore.setIsAucation(false);
      if (!current) {
        router.push("/");
      }
    }
  }
);

watch(
  () => aucationsStore.isAucationDeleted,
  (isDeleted) => {
    if (isDeleted) {
      aucationsStore.setIsAucationDeleted(false);
      router.push("/");
    }
  }
);

watch(
  () => aucationsStore.isBidDeleted,
  (isDeleted) => {
    if (isDeleted) {
      aucationsStore.setIsBidDeleted(false);
      reloadAucation();
    }
  }
);

async function handleDelete() {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus lelang ini?");
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsAucationDelete(aucationId.value);
  }
}

async function handleDeleteBid() {
  const result = await showConfirmDialog("Apakah Anda yakin ingin membatalkan penawaran Anda?");
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsBidDelete(aucationId.value);
  }
}
</script>

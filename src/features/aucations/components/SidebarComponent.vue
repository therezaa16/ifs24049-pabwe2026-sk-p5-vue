<template>
  <div>
    <div
      v-if="isSidebarOpen"
      data-testid="sidebar-backdrop"
      @click="$emit('close-mobile')"
      class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
    />

    <aside
      class="fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 p-4 transition-transform duration-200 ease-in-out md:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex flex-col h-full justify-between">
        <div>
          <p class="px-3 text-xs font-bold uppercase tracking-wider text-slate-600">Menu Utama</p>
          <nav class="mt-3 space-y-1" aria-label="Menu utama">
            <RouterLink
              v-for="item in navItems"
              :key="item.label"
              :to="item.to"
              @click="$emit('close-mobile')"
              :aria-current="isActive(item) ? 'page' : undefined"
              class="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
              :class="
                isActive(item)
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/25 font-semibold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              "
            >
              <span class="flex items-center gap-3">
                <component :is="item.icon" :size="20" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </span>
              <ChevronRight v-if="isActive(item)" :size="16" aria-hidden="true" />
            </RouterLink>
          </nav>
        </div>

        <div class="p-3 rounded-2xl bg-teal-50 border border-teal-100">
          <p class="text-xs font-semibold text-teal-900">Praktikum 5 PABWE</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { RouterLink, useRoute } from "vue-router";
import { LayoutDashboard, Gavel, Users, UserCircle, ChevronRight } from "lucide-vue-next";

defineProps({
  isSidebarOpen: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close-mobile"]);

const route = useRoute();

const navItems = [
  { to: "/", label: "Dashboard Lelang", icon: LayoutDashboard, path: "/", tab: "" },
  { to: { path: "/", query: { tab: "mine" } }, label: "Lelang Saya", icon: Gavel, path: "/", tab: "mine" },
  { to: "/users", label: "Daftar Pengguna", icon: Users, path: "/users" },
  { to: "/profile", label: "Profil Saya", icon: UserCircle, path: "/profile" },
];

function isActive(item) {
  if (item.tab !== undefined) {
    return route.path === "/" && (route.query.tab === "mine" ? "mine" : "") === item.tab;
  }
  return route.path === item.path;
}
</script>

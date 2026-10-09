import { describe, it, expect } from "vitest";
import { createMemoryHistory } from "vue-router";
import SidebarComponent from "./SidebarComponent.vue";
import { renderWithProviders } from "../../../test-utils";
import { createAppRouter } from "../../../router";

async function setup(path, isSidebarOpen = true) {
  const router = createAppRouter(createMemoryHistory());
  router.push(path);
  await router.isReady();
  return renderWithProviders(SidebarComponent, { router, props: { isSidebarOpen } });
}

describe("SidebarComponent", () => {
  it("should render navigation links properly", async () => {
    const { wrapper } = await setup("/", false);

    expect(wrapper.text()).toContain("Dashboard Lelang");
    expect(wrapper.text()).toContain("Lelang Saya");
    expect(wrapper.text()).toContain("Daftar Pengguna");
    expect(wrapper.text()).toContain("Profil Saya");
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);
  });

  it("should mark dashboard active on home route", async () => {
    const { wrapper } = await setup("/");
    const current = wrapper.findAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].text()).toContain("Dashboard Lelang");
  });

  it("should mark my aucations active when tab is mine", async () => {
    const { wrapper } = await setup("/?tab=mine");
    const current = wrapper.findAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].text()).toContain("Lelang Saya");
  });

  it("should treat unknown tab as dashboard", async () => {
    const { wrapper } = await setup("/?tab=other");
    expect(wrapper.find('[aria-current="page"]').text()).toContain("Dashboard Lelang");
  });

  it("should mark users and profile active by path", async () => {
    const { wrapper: users } = await setup("/users");
    expect(users.find('[aria-current="page"]').text()).toContain("Daftar Pengguna");

    const { wrapper: profile } = await setup("/profile");
    expect(profile.find('[aria-current="page"]').text()).toContain("Profil Saya");
  });

  it("should emit close-mobile when backdrop or link clicked", async () => {
    const { wrapper } = await setup("/");

    await wrapper.find('[data-testid="sidebar-backdrop"]').trigger("click");
    expect(wrapper.emitted("close-mobile")).toHaveLength(1);

    const link = wrapper.findAll("a").find((l) => l.text().includes("Daftar Pengguna"));
    await link.trigger("click");
    expect(wrapper.emitted("close-mobile")).toHaveLength(2);
  });
});

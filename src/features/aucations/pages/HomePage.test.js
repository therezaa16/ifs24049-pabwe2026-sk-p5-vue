import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory } from "vue-router";
import HomePage from "./HomePage.vue";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { createAppRouter } from "../../../router";
import * as toolsHelper from "../../../helpers/toolsHelper";

const profile = { id: 1, name: "Eliza", email: "eliza@del.ac.id" };

const aucations = [
  {
    id: 1,
    user_id: 1,
    title: "Keyboard Gaming",
    cover: "https://img/k.jpg",
    description: "Barang mulus",
    start_bid: 200000,
    closed_at: "2099-01-01 10:00:00",
    bids: [],
  },
  {
    id: 2,
    user_id: 2,
    title: "Oculus Quest",
    cover: null,
    description: "",
    start_bid: 5000000,
    closed_at: "2020-01-01 10:00:00",
    bids: [2],
  },
  {
    id: 3,
    user_id: 2,
    title: "Mouse",
    cover: null,
    description: "Mouse wireless",
    start_bid: 100000,
    closed_at: "2099-01-01 10:00:00",
    bids: [{ id: 1, bid: 150000 }, { id: 2, bid: 175000 }],
  },
  {
    id: 4,
    user_id: 2,
    title: "Monitor",
    cover: null,
    start_bid: 900000,
    closed_at: "2099-01-01 10:00:00",
  },
];

async function setup({ state = {}, withProfile = true, path = "/" } = {}) {
  const router = createAppRouter(createMemoryHistory());
  router.push(path);
  await router.isReady();

  const { pinia, aucationsStore } = createMockPinia({
    profile: withProfile ? profile : null,
    aucations,
    ...state,
  });
  const listSpy = vi.spyOn(aucationsStore, "asyncSetAucations").mockResolvedValue(undefined);
  vi.spyOn(aucationsStore, "asyncSetAucation").mockResolvedValue(undefined);
  const result = renderWithProviders(HomePage, { pinia, router });
  await flushPromises();
  return { ...result, aucationsStore, listSpy };
}

const norm = (t) => t.replace(/\s/g, " ");

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render nothing while profile is not loaded", async () => {
    const { wrapper } = await setup({ withProfile: false });
    expect(wrapper.find("h1").exists()).toBe(false);
  });

  it("should load all aucations on mount and render cards", async () => {
    const { wrapper, listSpy } = await setup();

    expect(listSpy).toHaveBeenCalledWith({});
    expect(wrapper.findAll('[data-testid^="aucation-card-"]')).toHaveLength(4);

    const card1 = wrapper.find('[data-testid="aucation-card-1"]');
    expect(card1.find("img").attributes("src")).toBe("https://img/k.jpg");
    expect(card1.text()).toContain("Berlangsung");
    expect(norm(card1.text())).toContain("Rp 200.000");
    expect(wrapper.find('[data-testid="highest-1"]').text()).toBe("Belum ada");
    expect(wrapper.find('[data-testid="countdown-1"]').text()).toContain("lagi");

    expect(wrapper.find('[data-testid="status-2"]').text()).toBe("Ditutup");
    expect(wrapper.find('[data-testid="countdown-2"]').text()).toContain("Ditutup");
    expect(wrapper.find('[data-testid="highest-2"]').text()).toBe("1 penawaran");
    expect(norm(wrapper.find('[data-testid="highest-3"]').text())).toBe("Rp 175.000");
    expect(wrapper.find('[data-testid="highest-4"]').text()).toBe("Belum ada");
  });

  it("should show edit and delete actions only for owned aucations", async () => {
    const { wrapper } = await setup();

    expect(wrapper.find('[data-testid="edit-aucation-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-aucation-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-aucation-2"]').exists()).toBe(false);
  });

  it("should start on my tab when query tab is mine and follow query changes", async () => {
    const { wrapper, listSpy, router } = await setup({ path: "/?tab=mine" });

    expect(listSpy).toHaveBeenCalledWith({ is_me: 1 });
    expect(wrapper.find('[data-testid="tab-mine-btn"]').attributes("aria-pressed")).toBe("true");

    await router.push("/");
    await flushPromises();
    expect(wrapper.find('[data-testid="tab-all-btn"]').attributes("aria-pressed")).toBe("true");
    expect(listSpy).toHaveBeenLastCalledWith({});

    await router.push("/?tab=mine");
    await flushPromises();
    expect(wrapper.find('[data-testid="tab-mine-btn"]').attributes("aria-pressed")).toBe("true");
  });

  it("should filter open and closed aucations on the client", async () => {
    const { wrapper } = await setup();

    await wrapper.find('[data-testid="tab-open-btn"]').trigger("click");
    await flushPromises();
    expect(wrapper.findAll('[data-testid^="aucation-card-"]')).toHaveLength(3);
    expect(wrapper.find('[data-testid="aucation-card-2"]').exists()).toBe(false);

    await wrapper.find('[data-testid="tab-closed-btn"]').trigger("click");
    await flushPromises();
    expect(wrapper.findAll('[data-testid^="aucation-card-"]')).toHaveLength(1);
    expect(wrapper.find('[data-testid="aucation-card-2"]').exists()).toBe(true);
  });

  it("should reload with is_me when switching to my tab", async () => {
    const { wrapper, listSpy } = await setup();
    listSpy.mockClear();

    await wrapper.find('[data-testid="tab-mine-btn"]').trigger("click");
    await flushPromises();

    expect(listSpy).toHaveBeenCalledWith({ is_me: 1 });
  });

  it("should search by title or description", async () => {
    const { wrapper } = await setup();
    const search = wrapper.find('[data-testid="search-aucation-input"]');

    await search.setValue("  mulus ");
    expect(wrapper.findAll('[data-testid^="aucation-card-"]')).toHaveLength(1);

    await search.setValue("oculus");
    expect(wrapper.find('[data-testid="aucation-card-2"]').exists()).toBe(true);

    await search.setValue("tidak ada");
    expect(wrapper.text()).toContain("Belum ada lelang yang cocok.");
  });

  it("should handle aucations missing title and description when searching", async () => {
    const { wrapper } = await setup({
      state: { aucations: [{ id: 9, user_id: 2, start_bid: 1, closed_at: "2099-01-01 10:00:00" }] },
    });

    await wrapper.find('[data-testid="search-aucation-input"]').setValue("x");
    expect(wrapper.text()).toContain("Belum ada lelang yang cocok.");
  });

  it("should show loading state while list is empty and request pending", async () => {
    const router = createAppRouter(createMemoryHistory());
    router.push("/");
    await router.isReady();
    const { pinia, aucationsStore } = createMockPinia({ profile, aucations: [] });
    let resolve = () => {};
    vi.spyOn(aucationsStore, "asyncSetAucations").mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const { wrapper } = renderWithProviders(HomePage, { pinia, router });
    await flushPromises();
    expect(wrapper.text()).toContain("Memuat daftar lelang...");

    resolve();
    await flushPromises();
    expect(wrapper.text()).toContain("Belum ada lelang yang cocok.");
  });

  it("should refresh countdown every 30 seconds and clear timer on unmount", async () => {
    vi.useFakeTimers();
    const router = createAppRouter(createMemoryHistory());
    router.push("/");
    await router.isReady();
    const { pinia, aucationsStore } = createMockPinia({ profile, aucations });
    vi.spyOn(aucationsStore, "asyncSetAucations").mockResolvedValue(undefined);
    const nowSpy = vi.spyOn(Date, "now");
    const { wrapper } = renderWithProviders(HomePage, { pinia, router });

    nowSpy.mockClear();
    vi.advanceTimersByTime(30000);
    expect(nowSpy).toHaveBeenCalled();

    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    wrapper.unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("should open add modal, reload when saved and close", async () => {
    const { wrapper, listSpy } = await setup();

    await wrapper.find('[data-testid="add-aucation-btn"]').trigger("click");
    expect(wrapper.findComponent(AddModal).props("show")).toBe(true);

    listSpy.mockClear();
    wrapper.findComponent(AddModal).vm.$emit("saved");
    await flushPromises();
    expect(listSpy).toHaveBeenCalledTimes(1);

    wrapper.findComponent(AddModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.findComponent(AddModal).props("show")).toBe(false);
  });

  it("should open change modal for selected aucation", async () => {
    const { wrapper, listSpy } = await setup();

    await wrapper.find('[data-testid="edit-aucation-1"]').trigger("click");
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(true);
    expect(wrapper.findComponent(ChangeModal).props("aucationId")).toBe(1);

    listSpy.mockClear();
    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    await flushPromises();
    expect(listSpy).toHaveBeenCalledTimes(1);

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(false);
  });

  it("should delete an aucation only after confirmation", async () => {
    const { wrapper, aucationsStore } = await setup();
    const deleteSpy = vi.spyOn(aucationsStore, "asyncSetIsAucationDelete").mockResolvedValue(undefined);
    vi.spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValueOnce({ isConfirmed: false })
      .mockResolvedValueOnce({ isConfirmed: true });

    await wrapper.find('[data-testid="delete-aucation-1"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="delete-aucation-1"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should delete all aucations only after confirmation", async () => {
    const { wrapper, aucationsStore } = await setup();
    const spy = vi.spyOn(aucationsStore, "asyncSetIsAucationDeleteAll").mockResolvedValue(undefined);
    vi.spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValueOnce({ isConfirmed: false })
      .mockResolvedValueOnce({ isConfirmed: true });

    await wrapper.find('[data-testid="delete-all-aucations-btn"]').trigger("click");
    await flushPromises();
    expect(spy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="delete-all-aucations-btn"]').trigger("click");
    await flushPromises();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should reload after delete and delete-all flags change", async () => {
    const { aucationsStore, listSpy } = await setup();
    listSpy.mockClear();

    aucationsStore.setIsAucationDeleted(true);
    await flushPromises();
    expect(aucationsStore.isAucationDeleted).toBe(false);
    expect(listSpy).toHaveBeenCalledTimes(1);

    aucationsStore.setIsAucationDeletedAll(true);
    await flushPromises();
    expect(aucationsStore.isAucationDeletedAll).toBe(false);
    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});

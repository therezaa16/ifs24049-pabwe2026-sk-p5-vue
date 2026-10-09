import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory } from "vue-router";
import DetailPage from "./DetailPage.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import BidModal from "../modals/BidModal.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { createAppRouter } from "../../../router";
import * as toolsHelper from "../../../helpers/toolsHelper";

vi.mock("../components/MarkdownViewer.vue", () => ({
  __esModule: true,
  default: {
    props: ["content"],
    template: '<div data-testid="markdown-viewer-stub">{{ content }}</div>',
  },
}));

const profile = { id: 1, name: "Eliza", email: "eliza@del.ac.id" };

const base = {
  id: 5,
  user_id: 2,
  title: "Oculus Quest 2",
  cover: "https://img/c.jpg",
  description: "Second mulus",
  start_bid: 5000000,
  closed_at: "2099-01-01 10:00:00",
  author: { name: "Ubaid" },
  bids: [
    { id: 1, bid: 6000000, created_at: "2024-10-05T08:44:12.000000Z" },
    { id: 2, bid: 7000000, created_at: "2024-10-05T08:45:12.000000Z" },
  ],
  my_bid: { id: 2, bid: 7000000 },
};

async function setup(aucation = base, state = {}, id = "5") {
  const router = createAppRouter(createMemoryHistory());
  router.push(`/aucations/${id}`);
  await router.isReady();
  const pushSpy = vi.spyOn(router, "push");

  const { pinia, aucationsStore } = createMockPinia({ profile, aucation, ...state });
  const detailSpy = vi.spyOn(aucationsStore, "asyncSetAucation").mockResolvedValue(undefined);
  const result = renderWithProviders(DetailPage, { pinia, router });
  return { ...result, aucationsStore, detailSpy, pushSpy };
}

const norm = (t) => t.replace(/\s/g, " ");

describe("DetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch detail by route id and show loading when missing", async () => {
    const { wrapper, detailSpy } = await setup(null);
    expect(detailSpy).toHaveBeenCalledWith("5");
    expect(wrapper.text()).toContain("Memuat detail lelang...");

    const { wrapper: noProfile } = await setup(base, { profile: null });
    expect(noProfile.text()).toContain("Memuat detail lelang...");
  });

  it("should render aucation detail for a participant", async () => {
    const { wrapper } = await setup();
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="markdown-viewer-stub"]').exists()).toBe(true)
    );

    expect(wrapper.find("h1").text()).toBe("Oculus Quest 2");
    expect(wrapper.find("img").attributes("src")).toBe("https://img/c.jpg");
    expect(wrapper.text()).toContain("Ubaid");
    expect(wrapper.find('[data-testid="detail-status"]').text()).toBe("Berlangsung");
    expect(wrapper.find('[data-testid="detail-time-left"]').text()).toContain("lagi");
    expect(norm(wrapper.find('[data-testid="detail-start-bid"]').text())).toBe("Rp 5.000.000");
    expect(norm(wrapper.find('[data-testid="detail-highest-bid"]').text())).toBe("Rp 7.000.000");
    expect(wrapper.find('[data-testid="markdown-viewer-stub"]').text()).toBe("Second mulus");
    expect(norm(wrapper.find('[data-testid="my-bid-value"]').text())).toBe("Rp 7.000.000");

    const items = wrapper.findAll('[data-testid^="bid-item-"]');
    expect(items).toHaveLength(2);
    expect(items[0].attributes("data-testid")).toBe("bid-item-2");

    expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="open-bid-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-bid-btn"]').exists()).toBe(true);
  });

  it("should render a closed aucation without bid actions and with fallbacks", async () => {
    const { wrapper } = await setup({
      ...base,
      cover: null,
      author: null,
      description: "",
      closed_at: "2020-01-01 10:00:00",
      bids: undefined,
      my_bid: null,
    });

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find('[data-testid="detail-status"]').text()).toBe("Ditutup");
    expect(wrapper.find('[data-testid="detail-highest-bid"]').text()).toBe("Belum ada");
    expect(wrapper.text()).toContain("Tidak ada deskripsi rinci untuk lelang ini.");
    expect(wrapper.text()).toContain("Anda belum mengajukan penawaran.");
    expect(wrapper.find('[data-testid="no-bids"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="open-bid-btn"]').exists()).toBe(false);
  });

  it("should offer bid without cancel button when user has no bid", async () => {
    const { wrapper } = await setup({ ...base, my_bid: null });
    expect(wrapper.find('[data-testid="open-bid-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-bid-btn"]').exists()).toBe(false);
  });

  it("should ignore non-object bids in history", async () => {
    const { wrapper } = await setup({ ...base, bids: [3, { id: 9, bid: 100 }] });
    expect(wrapper.findAll('[data-testid^="bid-item-"]')).toHaveLength(1);
  });

  it("should show owner actions and hide bid section for the owner", async () => {
    const { wrapper } = await setup({ ...base, user_id: 1 });

    expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-detail-aucation-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-detail-aucation-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="open-bid-btn"]').exists()).toBe(false);
    expect(wrapper.find("#my-bid-heading").exists()).toBe(false);
  });

  it("should open cover and edit modals as owner and reload after saved", async () => {
    const { wrapper, detailSpy } = await setup({ ...base, user_id: 1 });

    await wrapper.find('[data-testid="edit-cover-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-cover-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="edit-detail-aucation-btn"]').trigger("click");
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(true);

    detailSpy.mockClear();
    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    expect(detailSpy).toHaveBeenCalledWith("5");

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.findComponent(ChangeModal).props("show")).toBe(false);
  });

  it("should open bid modal, reload after saved and close", async () => {
    const { wrapper, detailSpy } = await setup();

    await wrapper.find('[data-testid="open-bid-btn"]').trigger("click");
    expect(wrapper.findComponent(BidModal).props("show")).toBe(true);

    detailSpy.mockClear();
    wrapper.findComponent(BidModal).vm.$emit("saved");
    expect(detailSpy).toHaveBeenCalledWith("5");

    wrapper.findComponent(BidModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.findComponent(BidModal).props("show")).toBe(false);
  });

  it("should fetch again when route id changes but not when it is empty", async () => {
    const { router, detailSpy } = await setup();
    detailSpy.mockClear();

    await router.push("/aucations/9");
    await flushPromises();
    expect(detailSpy).toHaveBeenCalledWith("9");

    detailSpy.mockClear();
    await router.push("/");
    await flushPromises();
    expect(detailSpy).not.toHaveBeenCalled();
  });

  it("should redirect home when detail failed to load, stay otherwise", async () => {
    const { aucationsStore, pushSpy } = await setup(null);
    aucationsStore.setIsAucation(true);
    await flushPromises();
    expect(aucationsStore.isAucation).toBe(false);
    expect(pushSpy).toHaveBeenCalledWith("/");

    const { aucationsStore: store2, pushSpy: push2 } = await setup();
    store2.setIsAucation(true);
    await flushPromises();
    expect(store2.isAucation).toBe(false);
    expect(push2).not.toHaveBeenCalled();
  });

  it("should delete aucation only after confirmation and redirect after deleted", async () => {
    const { wrapper, aucationsStore, pushSpy } = await setup({ ...base, user_id: 1 });
    const deleteSpy = vi.spyOn(aucationsStore, "asyncSetIsAucationDelete").mockResolvedValue(undefined);
    vi.spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValueOnce({ isConfirmed: false })
      .mockResolvedValueOnce({ isConfirmed: true });

    await wrapper.find('[data-testid="delete-detail-aucation-btn"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="delete-detail-aucation-btn"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith("5");

    aucationsStore.setIsAucationDeleted(true);
    await flushPromises();
    expect(aucationsStore.isAucationDeleted).toBe(false);
    expect(pushSpy).toHaveBeenCalledWith("/");

    pushSpy.mockClear();
    aucationsStore.setIsAucationDeleted(false);
    await flushPromises();
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it("should cancel own bid only after confirmation and reload after deleted", async () => {
    const { wrapper, aucationsStore, detailSpy } = await setup();
    const spy = vi.spyOn(aucationsStore, "asyncSetIsBidDelete").mockResolvedValue(undefined);
    vi.spyOn(toolsHelper, "showConfirmDialog")
      .mockResolvedValueOnce({ isConfirmed: false })
      .mockResolvedValueOnce({ isConfirmed: true });

    await wrapper.find('[data-testid="delete-bid-btn"]').trigger("click");
    await flushPromises();
    expect(spy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="delete-bid-btn"]').trigger("click");
    await flushPromises();
    expect(spy).toHaveBeenCalledWith("5");

    detailSpy.mockClear();
    aucationsStore.setIsBidDeleted(true);
    await flushPromises();
    expect(aucationsStore.isBidDeleted).toBe(false);
    expect(detailSpy).toHaveBeenCalledWith("5");

    detailSpy.mockClear();
    aucationsStore.setIsBidDeleted(false);
    await flushPromises();
    expect(detailSpy).not.toHaveBeenCalled();
  });
});

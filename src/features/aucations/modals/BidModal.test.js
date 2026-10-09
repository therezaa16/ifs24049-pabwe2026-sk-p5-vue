import { describe, it, expect, vi, beforeEach } from "vitest";
import BidModal from "./BidModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));
const norm = (text) => text.replace(/\s/g, " ");

const noBids = { id: 3, title: "Keyboard", start_bid: 200000, bids: [] };
const withBids = {
  id: 4,
  title: "Oculus",
  start_bid: 5000000,
  bids: [{ id: 1, bid: 6000000 }, { id: 2, bid: 7000000 }],
};

describe("BidModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should not render when hidden or without aucation", () => {
    const { wrapper } = renderWithProviders(BidModal, { props: { show: false, aucation: noBids } });
    expect(wrapper.find('[data-testid="bid-modal"]').exists()).toBe(false);

    const { wrapper: empty } = renderWithProviders(BidModal, { props: { show: true } });
    expect(empty.find('[data-testid="bid-modal"]').exists()).toBe(false);
  });

  it("should show start price and no highest bid when there are no bids", () => {
    const { wrapper } = renderWithProviders(BidModal, { props: { show: true, aucation: noBids } });

    expect(norm(wrapper.find('[data-testid="bid-start-price"]').text())).toBe("Rp 200.000");
    expect(wrapper.find('[data-testid="bid-highest-price"]').text()).toBe("Belum ada");
    expect(wrapper.find('[data-testid="bid-input"]').attributes("min")).toBe("200000");
  });

  it("should require bid higher than highest existing bid", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(BidModal, {
      props: { show: true, aucation: withBids },
    });
    const bidSpy = vi.spyOn(aucationsStore, "asyncSetIsBidAdd").mockReturnValue(Promise.resolve());

    expect(norm(wrapper.find('[data-testid="bid-highest-price"]').text())).toBe("Rp 7.000.000");

    await wrapper.find('[data-testid="bid-input"]').setValue("7000000");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledTimes(1);
    expect(norm(toolsHelper.showErrorDialog.mock.calls[0][0])).toBe("Penawaran minimal Rp 7.000.001");
    expect(bidSpy).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="bid-input"]').setValue("");
    await wrapper.find("form").trigger("submit");
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledTimes(2);
  });

  it("should accept the start price as first bid and emit saved on success", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(BidModal, {
      props: { show: true, aucation: noBids },
    });
    const bidSpy = vi.spyOn(aucationsStore, "asyncSetIsBidAdd").mockReturnValue(Promise.resolve());

    await wrapper.find('[data-testid="bid-input"]').setValue("200000");
    await wrapper.find("form").trigger("submit");

    expect(bidSpy).toHaveBeenCalledWith(3, 200000);
    expect(wrapper.text()).toContain("Mengirim...");

    aucationsStore.setIsBidAdd(true);
    aucationsStore.setIsBidAdded(true);
    await tick();

    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(aucationsStore.isBidAdd).toBe(false);
    expect(aucationsStore.isBidAdded).toBe(false);
  });

  it("should stay open when bid failed or flag not triggered", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(BidModal, {
      props: { show: true, aucation: noBids },
    });
    vi.spyOn(aucationsStore, "asyncSetIsBidAdd").mockReturnValue(Promise.resolve());

    aucationsStore.setIsBidAdded(true);
    await tick();
    expect(wrapper.emitted("close")).toBeUndefined();

    aucationsStore.setIsBidAdded(false);
    await wrapper.find('[data-testid="bid-input"]').setValue("300000");
    await wrapper.find("form").trigger("submit");
    aucationsStore.setIsBidAdd(true);
    await tick();

    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.text()).not.toContain("Mengirim...");
  });

  it("should reset input and manage body scroll when visibility changes", async () => {
    const { wrapper } = renderWithProviders(BidModal, { props: { show: true, aucation: noBids } });

    await wrapper.find('[data-testid="bid-input"]').setValue("999999");
    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");

    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");
    expect(wrapper.find('[data-testid="bid-input"]').element.value).toBe("");
  });

  it("should emit close from close and cancel buttons", async () => {
    const { wrapper } = renderWithProviders(BidModal, { props: { show: true, aucation: noBids } });
    await wrapper.find('[data-testid="close-bid-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-bid-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
  });
});

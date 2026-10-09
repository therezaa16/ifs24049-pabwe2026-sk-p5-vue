import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));
const id = (name) => `[data-testid="add-aucation-${name}-input"]`;

async function fill(wrapper, parts = ["title", "description", "start-bid", "closed-at"]) {
  const values = {
    title: "  Keyboard RGB  ",
    description: "  Masih mulus  ",
    "start-bid": "200000",
    "closed-at": "2026-12-31T23:59",
  };
  for (const p of parts) await wrapper.find(id(p)).setValue(values[p]);
}

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-aucation-modal"]').exists()).toBe(false);
  });

  it("should validate each required field in order", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    const submit = () => wrapper.find("form").trigger("submit");

    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Judul tidak boleh kosong");

    await fill(wrapper, ["title"]);
    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Deskripsi tidak boleh kosong");

    await fill(wrapper, ["description"]);
    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Harga awal harus lebih besar dari 0");

    await fill(wrapper, ["start-bid"]);
    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith(
      "Batas waktu penutupan tidak boleh kosong"
    );
  });

  it("should submit trimmed values and close with saved event on success", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi.spyOn(aucationsStore, "asyncSetIsAucationAdd").mockReturnValue(Promise.resolve());

    await fill(wrapper);
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith("Keyboard RGB", "Masih mulus", 200000, "2026-12-31 23:59:00");
    expect(wrapper.text()).toContain("Menyimpan...");

    aucationsStore.setIsAucationAdd(true);
    aucationsStore.setIsAucationAdded(true);
    await tick();

    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(wrapper.find(id("title")).element.value).toBe("");
    expect(wrapper.find(id("start-bid")).element.value).toBe("");
    expect(aucationsStore.isAucationAdd).toBe(false);
    expect(aucationsStore.isAucationAdded).toBe(false);
  });

  it("should stay open when add failed", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(AddModal, { props: { show: true } });
    vi.spyOn(aucationsStore, "asyncSetIsAucationAdd").mockReturnValue(Promise.resolve());

    await fill(wrapper);
    await wrapper.find("form").trigger("submit");
    aucationsStore.setIsAucationAdd(true);
    aucationsStore.setIsAucationAdded(false);
    await tick();

    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should ignore added flag when no add action finished", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(AddModal, { props: { show: true } });
    aucationsStore.setIsAucationAdded(true);
    await tick();
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("should emit close from close and cancel buttons", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
  });

  it("should lock and unlock body scroll when visibility changes", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");
    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });
});

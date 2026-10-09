import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

vi.mock("../components/MarkdownEditor.vue", () => ({
  __esModule: true,
  default: {
    props: ["modelValue", "textareaTestId"],
    emits: ["update:modelValue"],
    template:
      '<textarea :data-testid="textareaTestId" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

vi.mock("../components/MarkdownEditor.vue", () => ({
  __esModule: true,
  default: {
    props: ["modelValue", "textareaTestId"],
    emits: ["update:modelValue"],
    template:
      '<textarea :data-testid="textareaTestId" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

const tick = () => new Promise((r) => setTimeout(r, 10));
const field = (name) => `[data-testid="change-aucation-${name}-input"]`;

const existing = {
  id: 7,
  title: "Oculus Quest 2",
  description: "Second mulus",
  start_bid: 5000000,
  closed_at: "2024-10-05 22:00:00",
};

const ready = (wrapper) =>
  vi.waitFor(() => expect(wrapper.find(field("description")).exists()).toBe(true));

function setup(props, state = {}) {
  const { pinia, aucationsStore } = createMockPinia(state);
  const fetchSpy = vi.spyOn(aucationsStore, "asyncSetAucation").mockResolvedValue(undefined);
  const result = renderWithProviders(ChangeModal, { pinia, props });
  return { ...result, fetchSpy };
}

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should not render or fetch when hidden", () => {
    const { wrapper, fetchSpy } = setup({ show: false, aucationId: 7 }, { aucation: existing });
    expect(wrapper.find('[data-testid="change-aucation-modal"]').exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should not fetch when id is missing", () => {
    const { fetchSpy } = setup({ show: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should fetch and fill the form from store when shown", async () => {
    const { wrapper, fetchSpy } = setup({ show: true, aucationId: 7 }, { aucation: existing });
    await ready(wrapper);

    expect(fetchSpy).toHaveBeenCalledWith(7);
    expect(wrapper.find(field("title")).element.value).toBe("Oculus Quest 2");
    expect(wrapper.find(field("description")).element.value).toBe("Second mulus");
    expect(wrapper.find(field("start-bid")).element.value).toBe("5000000");
    expect(wrapper.find(field("closed-at")).element.value).toBe("2024-10-05T22:00");
  });

  it("should fetch when modal becomes visible and manage body scroll", async () => {
    const { wrapper, fetchSpy } = setup({ show: false, aucationId: 7 });

    await wrapper.setProps({ show: true });
    expect(fetchSpy).toHaveBeenCalledWith(7);
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should leave form empty when store has no aucation", () => {
    const { wrapper } = setup({ show: true, aucationId: 7 });
    expect(wrapper.find(field("title")).element.value).toBe("");
  });

  it("should validate all required fields", async () => {
    const { wrapper } = setup({ show: true, aucationId: 7 }, { aucation: existing });
    const submit = () => wrapper.find("form").trigger("submit");
    await ready(wrapper);

    await wrapper.find(field("title")).setValue(" ");
    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Judul tidak boleh kosong");

    await wrapper.find(field("title")).setValue("Judul");
    await wrapper.find(field("description")).setValue(" ");
    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Deskripsi tidak boleh kosong");

    await wrapper.find(field("description")).setValue("Deskripsi");
    await wrapper.find(field("start-bid")).setValue("0");
    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith("Harga awal harus lebih besar dari 0");

    await wrapper.find(field("start-bid")).setValue("1000");
    await wrapper.find(field("closed-at")).setValue("");
    await submit();
    expect(toolsHelper.showErrorDialog).toHaveBeenLastCalledWith(
      "Batas waktu penutupan tidak boleh kosong"
    );
  });

  it("should submit changes and emit saved and close on success", async () => {
    const { wrapper, aucationsStore } = setup({ show: true, aucationId: 7 }, { aucation: existing });
    const changeSpy = vi
      .spyOn(aucationsStore, "asyncSetIsAucationChange")
      .mockReturnValue(Promise.resolve());

    await wrapper.find(field("title")).setValue("Judul Baru");
    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(7, "Judul Baru", "Second mulus", 5000000, "2024-10-05 22:00:00");
    expect(wrapper.text()).toContain("Menyimpan...");

    aucationsStore.setIsAucationChange(true);
    aucationsStore.setIsAucationChanged(true);
    await tick();

    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(aucationsStore.isAucationChange).toBe(false);
    expect(aucationsStore.isAucationChanged).toBe(false);
  });

  it("should stay open when change failed or flag not triggered", async () => {
    const { wrapper, aucationsStore } = setup({ show: true, aucationId: 7 }, { aucation: existing });
    vi.spyOn(aucationsStore, "asyncSetIsAucationChange").mockReturnValue(Promise.resolve());

    aucationsStore.setIsAucationChanged(true);
    await tick();
    expect(wrapper.emitted("close")).toBeUndefined();

    aucationsStore.setIsAucationChanged(false);
    await wrapper.find("form").trigger("submit");
    aucationsStore.setIsAucationChange(true);
    await tick();

    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should emit close from close and cancel buttons", async () => {
    const { wrapper } = setup({ show: true, aucationId: 7 }, { aucation: existing });
    await wrapper.find('[data-testid="close-change-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-change-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
  });
});

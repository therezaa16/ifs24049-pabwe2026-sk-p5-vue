import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAucationsStore } from "./aucationsStore";
import aucationApi from "../api/aucationApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const dummy = { id: 1, title: "Test", description: "Desc", start_bid: 1000 };

const flags = [
  "isAucation",
  "isAucationAdd",
  "isAucationAdded",
  "isAucationChange",
  "isAucationChanged",
  "isAucationChangeCover",
  "isAucationChangedCover",
  "isAucationDelete",
  "isAucationDeleted",
  "isBidAdd",
  "isBidAdded",
  "isBidDelete",
  "isBidDeleted",
  "isAucationDeleteAll",
  "isAucationDeletedAll",
];

describe("aucationsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => {});
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should have correct default state", () => {
    const store = useAucationsStore();
    expect(store.aucations).toEqual([]);
    expect(store.aucation).toBeNull();
    flags.forEach((flag) => expect(store[flag]).toBe(false));
  });

  it("should update state with setters", () => {
    const store = useAucationsStore();
    store.setAucations([dummy]);
    store.setAucation(dummy);
    expect(store.aucations).toEqual([dummy]);
    expect(store.aucation).toEqual(dummy);

    flags.forEach((flag) => {
      const setter = `set${flag.charAt(0).toUpperCase()}${flag.slice(1)}`;
      store[setter](true);
      expect(store[flag]).toBe(true);
    });
  });

  describe("asyncSetAucations", () => {
    it("should set aucations on success and pass params", async () => {
      const store = useAucationsStore();
      const spy = vi.spyOn(aucationApi, "getAucations").mockResolvedValue([dummy]);

      await store.asyncSetAucations({ is_me: 1 });
      expect(spy).toHaveBeenCalledWith({ is_me: 1 });
      expect(store.aucations).toEqual([dummy]);
    });

    it("should use default params and reset on failure", async () => {
      const store = useAucationsStore();
      store.setAucations([dummy]);
      const spy = vi.spyOn(aucationApi, "getAucations").mockRejectedValue(new Error("x"));

      await store.asyncSetAucations();
      expect(spy).toHaveBeenCalledWith({});
      expect(store.aucations).toEqual([]);
    });
  });

  describe("asyncSetAucation", () => {
    it("should set detail and mark loaded", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "getAucationById").mockResolvedValue(dummy);

      await store.asyncSetAucation(1);
      expect(store.aucation).toEqual(dummy);
      expect(store.isAucation).toBe(true);
    });

    it("should set null on failure and still mark loaded", async () => {
      const store = useAucationsStore();
      store.setAucation(dummy);
      vi.spyOn(aucationApi, "getAucationById").mockRejectedValue(new Error("x"));

      await store.asyncSetAucation(1);
      expect(store.aucation).toBeNull();
      expect(store.isAucation).toBe(true);
    });
  });

  const mutations = [
    {
      name: "asyncSetIsAucationAdd",
      api: "postAucation",
      args: ["T", "D", 1, "x"],
      done: "isAucationAdded",
      flag: "isAucationAdd",
      fallback: null,
      success: "Lelang berhasil ditambahkan!",
      resolve: { aucation_id: 1 },
    },
    {
      name: "asyncSetIsAucationChange",
      api: "putAucation",
      args: [1, "T", "D", 1, "x"],
      done: "isAucationChanged",
      flag: "isAucationChange",
      fallback: "Lelang berhasil diperbarui!",
    },
    {
      name: "asyncSetIsAucationChangeCover",
      api: "postAucationCover",
      args: [1, new Blob(["x"])],
      done: "isAucationChangedCover",
      flag: "isAucationChangeCover",
      fallback: "Cover berhasil diperbarui!",
    },
    {
      name: "asyncSetIsAucationDelete",
      api: "deleteAucation",
      args: [1],
      done: "isAucationDeleted",
      flag: "isAucationDelete",
      fallback: "Lelang berhasil dihapus!",
    },
    {
      name: "asyncSetIsBidAdd",
      api: "postBid",
      args: [1, 5000],
      done: "isBidAdded",
      flag: "isBidAdd",
      fallback: "Penawaran berhasil diajukan!",
    },
    {
      name: "asyncSetIsBidDelete",
      api: "deleteBid",
      args: [1],
      done: "isBidDeleted",
      flag: "isBidDelete",
      fallback: "Penawaran berhasil dihapus!",
    },
    {
      name: "asyncSetIsAucationDeleteAll",
      api: "deleteAllAucations",
      args: [],
      done: "isAucationDeletedAll",
      flag: "isAucationDeleteAll",
      fallback: "Seluruh lelang berhasil dihapus!",
    },
  ];

  mutations.forEach((m) => {
    describe(m.name, () => {
      it("should flag success and show dialog", async () => {
        const store = useAucationsStore();
        vi.spyOn(aucationApi, m.api).mockResolvedValue(m.fallback === null ? m.resolve : "Pesan API");

        await store[m.name](...m.args);

        expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(
          m.fallback === null ? m.success : "Pesan API"
        );
        expect(store[m.done]).toBe(true);
        expect(store[m.flag]).toBe(true);
      });

      if (m.fallback !== null) {
        it("should use fallback message when API message is empty", async () => {
          const store = useAucationsStore();
          vi.spyOn(aucationApi, m.api).mockResolvedValue("");

          await store[m.name](...m.args);

          expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(m.fallback);
        });
      }

      it("should flag failure and show error", async () => {
        const store = useAucationsStore();
        vi.spyOn(aucationApi, m.api).mockRejectedValue(new Error("Gagal total"));

        await store[m.name](...m.args);

        expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal total");
        expect(store[m.done]).toBe(false);
        expect(store[m.flag]).toBe(true);
      });
    });
  });
});

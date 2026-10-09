import { describe, it, expect, vi, beforeEach } from "vitest";
import aucationApi from "./aucationApi";
import apiHelper from "../../../helpers/apiHelper";

function mockResponse(body) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  });
}

describe("aucationApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postAucation", () => {
    it("should post aucation as JSON and return data", async () => {
      const spy = mockResponse({ status: "success", data: { aucation_id: 3 } });

      const res = await aucationApi.postAucation("Judul", "Deskripsi", 1000, "2026-12-31 23:59:00");

      expect(res).toEqual({ aucation_id: 3 });
      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${DELCOM_BASEURL}/aucations/`);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(options.body)).toEqual({
        title: "Judul",
        description: "Deskripsi",
        start_bid: 1000,
        closed_at: "2026-12-31 23:59:00",
      });
    });

    it("should throw API message or fallback message", async () => {
      mockResponse({ status: "fail", message: "Data tidak valid" });
      await expect(aucationApi.postAucation("", "", 0, "")).rejects.toThrow("Data tidak valid");

      mockResponse({ status: "fail" });
      await expect(aucationApi.postAucation("", "", 0, "")).rejects.toThrow(
        "Gagal menambahkan lelang"
      );
    });
  });

  describe("postAucationCover", () => {
    it("should upload cover with FormData", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah cover" });
      const file = new File(["dummy"], "cover.jpg", { type: "image/jpeg" });

      expect(await aucationApi.postAucationCover(1, file)).toBe("Berhasil mengubah cover");

      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${DELCOM_BASEURL}/aucations/1/cover`);
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.body.get("cover").name).toBe("cover.jpg");
    });

    it("should use default file name for blobs without name", async () => {
      const spy = mockResponse({ status: "success", message: "ok" });

      await aucationApi.postAucationCover(1, new Blob(["x"], { type: "image/png" }));

      expect(spy.mock.calls[0][1].body.get("cover").name).toBe("cover.jpg");
    });

    it("should throw error when upload fails", async () => {
      mockResponse({ status: "fail" });
      await expect(
        aucationApi.postAucationCover(1, new File(["x"], "c.png", { type: "image/png" }))
      ).rejects.toThrow("Gagal mengubah cover");
    });
  });

  describe("putAucation", () => {
    it("should update aucation and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah data" });

      expect(await aucationApi.putAucation(2, "T", "D", 5, "2026-12-31 00:00:00")).toBe(
        "Berhasil mengubah data"
      );
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/aucations/2`);
      expect(spy.mock.calls[0][1].method).toBe("PUT");
    });

    it("should throw error when update fails", async () => {
      mockResponse({ status: "fail" });
      await expect(aucationApi.putAucation(2, "T", "D", 5, "x")).rejects.toThrow(
        "Gagal mengubah lelang"
      );
    });
  });

  describe("getAucations", () => {
    it("should fetch list without params", async () => {
      const spy = mockResponse({ status: "success", data: { aucations: [{ id: 1 }] } });

      expect(await aucationApi.getAucations()).toEqual([{ id: 1 }]);
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/aucations/`);
    });

    it("should send only filled query parameters", async () => {
      const spy = mockResponse({ status: "success", data: { aucations: [] } });

      await aucationApi.getAucations({ is_me: 1, is_closed: 0, other: "", empty: null, none: undefined });

      const url = spy.mock.calls[0][0];
      expect(url).toContain("?is_me=1&is_closed=0");
      expect(url).not.toContain("other=");
      expect(url).not.toContain("empty=");
      expect(url).not.toContain("none=");
    });

    it("should return empty list when data is missing", async () => {
      mockResponse({ status: "success" });
      expect(await aucationApi.getAucations()).toEqual([]);
    });

    it("should throw error when request fails", async () => {
      mockResponse({ status: "fail", message: "Unauthenticated." });
      await expect(aucationApi.getAucations()).rejects.toThrow("Unauthenticated.");
    });
  });

  describe("getAucationById", () => {
    it("should return detail or undefined", async () => {
      const spy = mockResponse({ status: "success", data: { aucation: { id: 4 } } });
      expect(await aucationApi.getAucationById(4)).toEqual({ id: 4 });
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/aucations/4`);

      mockResponse({ status: "success" });
      expect(await aucationApi.getAucationById(4)).toBeUndefined();
    });

    it("should throw error when request fails", async () => {
      mockResponse({ status: "fail" });
      await expect(aucationApi.getAucationById(4)).rejects.toThrow("Gagal mengambil detail lelang");
    });
  });

  describe("deleteAucation", () => {
    it("should delete aucation", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus data" });
      expect(await aucationApi.deleteAucation(4)).toBe("Berhasil menghapus data");
      expect(spy.mock.calls[0][1].method).toBe("DELETE");
    });

    it("should throw error when delete fails", async () => {
      mockResponse({ status: "fail" });
      await expect(aucationApi.deleteAucation(4)).rejects.toThrow("Gagal menghapus lelang");
    });
  });

  describe("bids", () => {
    it("should add bid", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil memberikan tawaran" });

      expect(await aucationApi.postBid(4, 10000)).toBe("Berhasil memberikan tawaran");
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/aucations/4/bids`);
      expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({ bid: 10000 });
    });

    it("should throw error when add bid fails", async () => {
      mockResponse({ status: "fail" });
      await expect(aucationApi.postBid(4, 1)).rejects.toThrow("Gagal mengajukan penawaran");
    });

    it("should delete bid", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus tawaran" });

      expect(await aucationApi.deleteBid(4)).toBe("Berhasil menghapus tawaran");
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/aucations/4/bids`);
      expect(spy.mock.calls[0][1].method).toBe("DELETE");
    });

    it("should throw error when delete bid fails", async () => {
      mockResponse({ status: "fail" });
      await expect(aucationApi.deleteBid(4)).rejects.toThrow("Gagal menghapus penawaran");
    });
  });

  describe("deleteAllAucations", () => {
    it("should delete all aucations", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus semua" });

      expect(await aucationApi.deleteAllAucations()).toBe("Berhasil menghapus semua");
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/aucations/`);
      expect(spy.mock.calls[0][1].method).toBe("DELETE");
    });

    it("should throw error when delete all fails", async () => {
      mockResponse({ status: "fail" });
      await expect(aucationApi.deleteAllAucations()).rejects.toThrow(
        "Gagal menghapus seluruh lelang"
      );
    });
  });
});

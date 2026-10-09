import { describe, it, expect, vi } from "vitest";
import Swal from "sweetalert2";
import {
  showErrorDialog,
  showWarningDialog,
  showSuccessDialog,
  showConfirmDialog,
  formatDate,
  formatRupiah,
  parseDateTime,
  isAucationClosed,
  formatTimeLeft,
  toApiDateTime,
  toLocalInput,
  getHighestBid,
} from "./toolsHelper";

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
    close: vi.fn(),
  },
}));

describe("toolsHelper", () => {
  it("should call Swal.fire for showErrorDialog and handle confirmation", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    await showErrorDialog("Error test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Terjadi Kesalahan",
        text: "Error test",
        icon: "error",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    // Not confirmed branch
    Swal.fire.mockResolvedValue({ isConfirmed: false });
    await showErrorDialog("Error test");
  });

  it("should call Swal.fire for showWarningDialog and handle confirmation", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    await showWarningDialog("Warning test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Peringatan",
        text: "Warning test",
        icon: "warning",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    Swal.fire.mockResolvedValue({ isConfirmed: false });
    await showWarningDialog("Warning test");
  });

  it("should call Swal.fire for showSuccessDialog and handle confirmation", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    await showSuccessDialog("Success test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Tindakan Berhasil",
        text: "Success test",
        icon: "success",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    Swal.fire.mockResolvedValue({ isConfirmed: false });
    await showSuccessDialog("Success test");
  });

  it("should call Swal.fire for showConfirmDialog", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    const res = await showConfirmDialog("Confirm test?");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Konfirmasi",
        text: "Confirm test?",
        icon: "question",
      })
    );
    expect(res.isConfirmed).toBe(true);
  });

  it("should format date correctly or return fallback for empty date", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    const formatted = formatDate("2024-02-26T02:34:26.000000Z");
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe("string");
  });

  it("should format rupiah and fall back to zero for invalid values", () => {
    expect(formatRupiah(2500000).replace(/\s/g, " ")).toBe("Rp 2.500.000");
    expect(formatRupiah("1000").replace(/\s/g, " ")).toBe("Rp 1.000");
    expect(formatRupiah(null).replace(/\s/g, " ")).toBe("Rp 0");
    expect(formatRupiah("abc").replace(/\s/g, " ")).toBe("Rp 0");
  });

  it("should parse date time and reject invalid input", () => {
    expect(parseDateTime("2024-10-05 22:00:00")).toBeInstanceOf(Date);
    expect(parseDateTime("")).toBeNull();
    expect(parseDateTime("bukan tanggal")).toBeNull();
  });

  it("should detect closed aucation", () => {
    const now = new Date("2026-10-08T10:00:00").getTime();
    expect(isAucationClosed("2026-10-08 09:00:00", now)).toBe(true);
    expect(isAucationClosed("2026-10-08 11:00:00", now)).toBe(false);
    expect(isAucationClosed("", now)).toBe(false);
    expect(typeof isAucationClosed("2020-01-01 00:00:00")).toBe("boolean");
  });

  it("should format time left in several ranges", () => {
    const now = new Date("2026-10-08T10:00:00").getTime();
    expect(formatTimeLeft("", now)).toBe("-");
    expect(formatTimeLeft("2026-10-08 09:00:00", now)).toBe("Ditutup");
    expect(formatTimeLeft("2026-10-10 12:00:00", now)).toBe("2 hari 2 jam lagi");
    expect(formatTimeLeft("2026-10-08 12:30:00", now)).toBe("2 jam 30 menit lagi");
    expect(formatTimeLeft("2026-10-08 10:05:00", now)).toBe("5 menit lagi");
    expect(formatTimeLeft("2026-10-08 10:00:10", now)).toBe("1 menit lagi");
    expect(typeof formatTimeLeft("2099-01-01 00:00:00")).toBe("string");
  });

  it("should convert between api and datetime-local formats", () => {
    expect(toApiDateTime("")).toBe("");
    expect(toApiDateTime("2026-12-31T23:59")).toBe("2026-12-31 23:59:00");
    expect(toApiDateTime("2026-12-31T23:59:30")).toBe("2026-12-31 23:59:30");
    expect(toLocalInput("")).toBe("");
    expect(toLocalInput("2024-10-05 22:00:00")).toBe("2024-10-05T22:00");
  });

  it("should get highest bid from bid objects and ignore ids", () => {
    expect(getHighestBid(undefined)).toBeNull();
    expect(getHighestBid([])).toBeNull();
    expect(getHighestBid([2, 3])).toBeNull();
    expect(getHighestBid([null, { bid: 100 }, { bid: 300 }, { bid: "200" }, {}])).toBe(300);
  });
});

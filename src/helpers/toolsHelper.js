async function fireDialog(options, closeOnConfirm = true) {
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire(options);
  if (closeOnConfirm && result.isConfirmed) {
    Swal.close();
  }
  return result;
}

export function showErrorDialog(message) {
  return fireDialog({
    title: "Terjadi Kesalahan",
    text: message,
    icon: "error",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#ef4444",
  });
}

export function showWarningDialog(message) {
  return fireDialog({
    title: "Peringatan",
    text: message,
    icon: "warning",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#f59e0b",
  });
}

export function showSuccessDialog(message) {
  return fireDialog({
    title: "Tindakan Berhasil",
    text: message,
    icon: "success",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#10b981",
  });
}

export function showConfirmDialog(message) {
  return fireDialog(
    {
      title: "Konfirmasi",
      text: message,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Tidak",
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#94a3b8",
    },
    false
  );
}

export function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRupiah(value) {
  const amount = Number(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function parseDateTime(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isAucationClosed(closedAt, now = Date.now()) {
  const date = parseDateTime(closedAt);
  return date ? date.getTime() <= now : false;
}

export function formatTimeLeft(closedAt, now = Date.now()) {
  const date = parseDateTime(closedAt);
  if (!date) return "-";
  const diff = date.getTime() - now;
  if (diff <= 0) return "Ditutup";
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam ${minutes % 60} menit lagi`;
  return `${Math.max(minutes, 1)} menit lagi`;
}

export function toApiDateTime(localValue) {
  if (!localValue) return "";
  const text = String(localValue).replace("T", " ");
  return text.length === 16 ? `${text}:00` : text;
}

export function toLocalInput(apiValue) {
  if (!apiValue) return "";
  return String(apiValue).replace(" ", "T").slice(0, 16);
}

export function getHighestBid(bids) {
  const values = (Array.isArray(bids) ? bids : [])
    .filter((item) => item && typeof item === "object")
    .map((item) => Number(item.bid) || 0);
  return values.length ? Math.max(...values) : null;
}

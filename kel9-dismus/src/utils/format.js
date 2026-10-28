export const rupiah = (value = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const tanggal = (value) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
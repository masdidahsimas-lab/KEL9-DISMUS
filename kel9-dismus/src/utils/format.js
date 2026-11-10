export const rupiah = (value = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const tanggal = (value, withTime = false) => {
  if (!value) return "—";

  // Ambil string tanggal murni dari objek atau string
  let rawDate = value;
  if (typeof value === "object" && !(value instanceof Date)) {
    rawDate =
      value.tanggal_pesanan ||
      value.tanggal ||
      value.tgl_pesanan ||
      value.created_at;
  }

  if (!rawDate) return "—";

  try {
    const strDate = String(rawDate).trim();
    // Ekstrak bagian YYYY-MM-DD langsung tanpa konversi timezone
    const datePart = strDate.includes("T")
      ? strDate.split("T")[0]
      : strDate.split(" ")[0];

    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("-");
      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
      ];
      const formattedDate = `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;

      // Ambil jam & menit jika dibutuhkan
      if (withTime) {
        const timeMatch = strDate.match(/\d{2}:\d{2}/);
        const timePart = timeMatch ? timeMatch[0] : "";
        return timePart ? `${formattedDate}, ${timePart} WIB` : formattedDate;
      }

      return formattedDate;
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(rawDate));
  } catch (err) {
    return String(rawDate);
  }
};
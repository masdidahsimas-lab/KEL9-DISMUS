export const VALID_MENU_CATEGORIES = ["dimsum", "minuman"];
export const VALID_PAYMENT_METHODS = ["QRIS", "Transfer Bank", "COD"];
export const VALID_STOCK_UNITS = ["gram", "kg", "ml", "liter", "pcs", "pack", "unit"];
export const VALID_EMPLOYEE_ROLES = ["karyawan", "manajer"];

export function validateInput({
  field = "Input",
  value,
  required = false,
  type = "string",
  domain = null,
  format = null,
  minLength,
  min,
  max,
  integer = false,
}) {
  const label = field;
  const normalizedValue =
    typeof value === "string" ? value.trim() : value;

  if (
    required &&
    (normalizedValue === "" ||
      normalizedValue === null ||
      normalizedValue === undefined)
  ) {
    return `${label} wajib diisi.`;
  }

  if (
    normalizedValue === "" ||
    normalizedValue === null ||
    normalizedValue === undefined
  ) {
    return null;
  }

  if (type === "string") {
    if (typeof value !== "string") {
      return `${label} harus berupa teks.`;
    }

    if (minLength && value.trim().length < minLength) {
      return `${label} minimal ${minLength} karakter.`;
    }
  }

  if (type === "number") {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return `${label} harus berupa angka.`;
    }

    if (integer && !Number.isInteger(numericValue)) {
      return `${label} harus berupa bilangan bulat.`;
    }

    if (min !== undefined && numericValue < min) {
      return `${label} minimal ${min}.`;
    }

    if (max !== undefined && numericValue > max) {
      return `${label} maksimal ${max}.`;
    }
  }

  if (type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    if (!emailRegex.test(String(value).trim())) {
      return `${label} harus berupa email yang valid.`;
    }
  }

  if (type === "phone") {
    const phoneRegex = /^(?:\+62|62|0)8\d{8,11}$/;
    if (!phoneRegex.test(String(value).trim())) {
      return `${label} harus berupa nomor WhatsApp yang valid, contoh: 08123456789.`;
    }
  }

  if (type === "date") {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(String(value))) {
      return `${label} harus format YYYY-MM-DD.`;
    }
  }

  if (domain) {
    const domainValues = domain.map((item) => String(item).toLowerCase());
    const cleanValue = String(normalizedValue).toLowerCase();

    if (!domainValues.includes(cleanValue)) {
      return `${label} harus salah satu dari: ${domain.join(", ")}.`;
    }
  }

  if (format) {
    const regex = format instanceof RegExp ? format : new RegExp(format);
    if (!regex.test(String(normalizedValue))) {
      return `${label} format tidak valid.`;
    }
  }

  return null;
}

export function validateDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;
  if (!startDate) return "Tanggal mulai wajib diisi.";
  if (!endDate) return "Tanggal selesai wajib diisi.";

  if (new Date(startDate) > new Date(endDate)) {
    return "Tanggal mulai tidak boleh lebih besar dari tanggal selesai.";
  }

  return null;
}

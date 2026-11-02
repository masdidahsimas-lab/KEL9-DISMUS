
import { supabase } from "../lib/supabase";

const STOCK_COLUMNS =
  "id, nama_bahan, jumlah_stok, satuan, updated_at";

export async function getStock() {
  return await supabase
    .from("stok_bahan_baku")
    .select(STOCK_COLUMNS)
    .order("nama_bahan", { ascending: true });
}

export async function saveStock(data, id = null) {
  const nama_bahan = data?.nama_bahan?.trim();
  const jumlah_stok = Number(data?.jumlah_stok);

  if (!nama_bahan) {
    return {
      data: null,
      error: new Error("Nama bahan wajib diisi."),
    };
  }

  if (!Number.isFinite(jumlah_stok) || jumlah_stok < 0) {
    return {
      data: null,
      error: new Error("Jumlah stok tidak valid."),
    };
  }

  const payload = {
    nama_bahan,
    jumlah_stok,
    satuan: data.satuan?.trim() || "unit",
    updated_at: new Date().toISOString(),
  };

  if (id) {
    return await supabase
      .from("stok_bahan_baku")
      .update(payload)
      .eq("id", id)
      .select(STOCK_COLUMNS)
      .single();
  }

  return await supabase
    .from("stok_bahan_baku")
    .insert(payload)
    .select(STOCK_COLUMNS)
    .single();
}

export async function deleteStock(id) {
  if (id === null || id === undefined) {
    return {
      data: null,
      error: new Error("ID bahan tidak valid."),
    };
  }

  return await supabase
    .from("stok_bahan_baku")
    .delete()
    .eq("id", id);
}

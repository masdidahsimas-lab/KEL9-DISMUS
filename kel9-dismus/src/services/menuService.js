
import { supabase } from "../lib/supabase";

<<<<<<< HEAD
// Konstanta untuk nama tabel menu
const MENU_TABLE = "menus";

/**
 * Mengambil seluruh data menu
 * berdasarkan urutan tanggal terbaru.
 */
export async function getMenus() {
  return supabase
    .from(MENU_TABLE)
    .select("*")
    .order("created_at", { ascending: false });
}

/**
 * Menyimpan data menu.
 * Jika ID tersedia, data diperbarui.
 * Jika ID tidak tersedia, data baru ditambahkan.
 */
export async function saveMenu(data, id) {
  if (id) {
    return supabase
      .from(MENU_TABLE)
      .update(data)
      .eq("id", id);
  }

  return supabase
    .from(MENU_TABLE)
    .insert(data);
=======
const MENU_COLUMNS =
  "id, nama_menu, kategori, harga, deskripsi, tersedia, created_at";

export async function getMenus() {
  return await supabase
    .from("menus")
    .select(MENU_COLUMNS)
    .order("created_at", { ascending: false });
}

export async function saveMenu(data, id = null) {
  const nama_menu = data?.nama_menu?.trim();
  const harga = Number(data?.harga);

  if (!nama_menu) {
    return {
      data: null,
      error: new Error("Nama menu wajib diisi."),
    };
  }

  if (!Number.isFinite(harga) || harga < 0) {
    return {
      data: null,
      error: new Error("Harga menu tidak valid."),
    };
  }

  const payload = {
    nama_menu,
    kategori: data.kategori?.trim() || "Lainnya",
    harga,
    deskripsi: data.deskripsi?.trim() || null,
    tersedia: data.tersedia !== false,
  };

  if (id) {
    return await supabase
      .from("menus")
      .update(payload)
      .eq("id", id)
      .select(MENU_COLUMNS)
      .single();
  }

  return await supabase
    .from("menus")
    .insert(payload)
    .select(MENU_COLUMNS)
    .single();
>>>>>>> 58a5625ee3cb89349b476d91de0b4c6f978df0cc
}

/**
 * Menghapus data menu berdasarkan ID.
 */
export async function deleteMenu(id) {
<<<<<<< HEAD
  return supabase
    .from(MENU_TABLE)
=======
  if (id === null || id === undefined) {
    return {
      data: null,
      error: new Error("ID menu tidak valid."),
    };
  }

  return await supabase
    .from("menus")
>>>>>>> 58a5625ee3cb89349b476d91de0b4c6f978df0cc
    .delete()
    .eq("id", id);
}

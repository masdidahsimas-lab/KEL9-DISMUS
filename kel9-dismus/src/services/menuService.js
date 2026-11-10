import { supabase } from "../lib/supabase";

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
}

/**
 * Menghapus data menu berdasarkan ID.
 */
export async function deleteMenu(id) {
  return supabase
    .from(MENU_TABLE)
    .delete()
    .eq("id", id);
}

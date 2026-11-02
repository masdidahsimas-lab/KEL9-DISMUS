
import { supabase } from "../lib/supabase";

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
}

export async function deleteMenu(id) {
  if (id === null || id === undefined) {
    return {
      data: null,
      error: new Error("ID menu tidak valid."),
    };
  }

  return await supabase
    .from("menus")
    .delete()
    .eq("id", id);
}

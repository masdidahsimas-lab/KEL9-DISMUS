import { supabase } from "../lib/supabase";

export async function getMenus() {
  return supabase.from("menus").select("*").order("created_at", { ascending: false });
}

export async function saveMenu(data, id) {
  return id ? supabase.from("menus").update(data).eq("id", id) : supabase.from("menus").insert(data);
}

export async function deleteMenu(id) {
  return supabase.from("menus").delete().eq("id", id);
}
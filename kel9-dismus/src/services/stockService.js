import { supabase } from "../lib/supabase";

export async function getStock() {
  return supabase.from("stok_bahan_baku").select("*").order("nama_bahan");
}

export async function saveStock(data, id) {
  return id ? supabase.from("stok_bahan_baku").update(data).eq("id", id) : supabase.from("stok_bahan_baku").insert(data);
}
import { supabase } from "../lib/supabase";

export async function getOrders() {
  return supabase.from("pesanan").select("*").order("created_at", { ascending: false });
}

export async function updateOrderStatus(id, status) {
  return supabase.from("pesanan").update({ status }).eq("id", id);
}

export async function createOrder(orderPayload) {
  try {
    const { data, error } = await supabase
      .from("pesanan")
      .insert([orderPayload])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
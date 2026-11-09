
import { supabase } from "../lib/supabase";

export async function getOrders() {
  return supabase
    .from("pesanan")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function updateOrderStatus(orderId, newStatus) {
  return supabase
    .from("pesanan")
    .update({ status: newStatus })
    .eq("id", orderId);
}

export async function createOrder(orderData) {
  try {
    const { data, error } = await supabase
      .from("pesanan")
      .insert([orderData])
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

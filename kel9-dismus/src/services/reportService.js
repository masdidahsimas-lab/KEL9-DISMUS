import { supabase } from "../lib/supabase";

export async function getReportData(startDate = null, endDate = null) {
  let query = supabase
    .from("pesanan")
    .select("id, kode_pesanan, tanggal_pesanan, total_harga, status")
    .order("tanggal_pesanan", { ascending: false });

  if (startDate) {
    query = query.gte("tanggal_pesanan", startDate);
  }

  if (endDate) {
    query = query.lte("tanggal_pesanan", `${endDate}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) throw error;

  const orders = data || [];
  const completedOrders = orders.filter(
    (order) => order.status === "Selesai"
  );

  return {
    orders,
    totalOrders: orders.length,
    completedCount: completedOrders.length,
    revenue: completedOrders.reduce(
      (total, order) => total + Number(order.total_harga || 0),
      0
    ),
  };
}
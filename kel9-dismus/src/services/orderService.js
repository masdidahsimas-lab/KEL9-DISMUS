
import { supabase } from "../lib/supabase";

const ORDER_STATUSES = [
  "Menunggu",
  "Dikonfirmasi",
  "Diproses",
  "Selesai",
  "Dibatalkan",
];

// FETCH DATA DENGAN JOIN TABEL PEMBAYARAN
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
    if (!pelanggan_id) {
      throw new Error("Pengguna belum login.");
    }

    if (!items.length) {
      throw new Error("Keranjang masih kosong.");
    }

    const details = items.map((item) => {
      const menu_id = item.menu_id ?? item.id;
      const jumlah = Number(item.jumlah ?? item.qty);
      const harga_satuan = Number(
        item.harga_satuan ?? item.harga ?? item.price
      );

      if (menu_id == null) {
        throw new Error("ID menu tidak ditemukan.");
      }

      if (!Number.isInteger(jumlah) || jumlah < 1) {
        throw new Error("Jumlah pesanan tidak valid.");
      }

      if (!Number.isFinite(harga_satuan) || harga_satuan < 0) {
        throw new Error("Harga menu tidak valid.");
      }

      return {
        menu_id,
        jumlah,
        harga_satuan,
        level_pedas: item.level_pedas ?? null,
        subtotal: jumlah * harga_satuan,
      };
    });

    const total_harga = details.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    const kode_pesanan = `DS-${Date.now()}`;

    const isQris = metode_pembayaran === "QRIS";
    const initialStatus = isQris ? "Dikonfirmasi" : "Menunggu";
    const initialPaymentStatus = isQris ? "Lunas" : "Menunggu";

    // 1. Simpan pesanan utama (Termasuk simpan kolom metode_pembayaran jika ada)
    const { data: order, error: orderError } = await supabase
      .from("pesanan")
      .insert([orderData])
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

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
  return await supabase
    .from("pesanan")
    .select("*, pembayaran(*)")
    .order("created_at", { ascending: false });
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) {
    return {
      data: null,
      error: new Error("Status pesanan tidak valid."),
    };
  }

  return await supabase
    .from("pesanan")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
}

export async function createOrder({
  pelanggan_id,
  items = [],
  metode_pembayaran = "Cash",
  catatan = null,
}) {
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
      .insert({
        pelanggan_id,
        kode_pesanan,
        tanggal_pesanan: new Date().toISOString(),
        total_harga,
        status: initialStatus,
        metode_pembayaran,
        catatan: catatan?.trim() || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Simpan detail pesanan
    const detailRows = details.map((item) => ({
      pesanan_id: order.id,
      menu_id: item.menu_id,
      jumlah: item.jumlah,
      harga_satuan: item.harga_satuan,
      level_pedas: item.level_pedas,
    }));

    const { error: detailError } = await supabase
      .from("detail_pesanan")
      .insert(detailRows);

    if (detailError) {
      throw new Error(
        `Pesanan utama berhasil dibuat, tetapi detail gagal disimpan: ${detailError.message}`
      );
    }

    // 3. Simpan data pembayaran
    const { error: paymentError } = await supabase
      .from("pembayaran")
      .insert({
        pesanan_id: order.id,
        metode_pembayaran,
        status_pembayaran: initialPaymentStatus,
        total_bayar: total_harga,
      });

    if (paymentError) {
      throw new Error(
        `Detail pesanan berhasil disimpan, tetapi pembayaran gagal: ${paymentError.message}`
      );
    }

    return {
      data: order,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}
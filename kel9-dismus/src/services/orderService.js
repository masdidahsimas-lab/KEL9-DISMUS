import { supabase } from "../lib/supabase";

const ORDER_STATUSES = [
  "Menunggu",
  "Dikonfirmasi",
  "Diproses",
  "Selesai",
  "Dibatalkan",
];

// FETCH DATA DENGAN JOIN TABEL PEMBAYARAN DAN DETAIL PESANAN
export async function getOrders() {
  return supabase
    .from("pesanan")
    .select(`
      *,
      pembayaran (*),
      detail_pesanan (
        *,
        menus (*)
      )
    `)
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
    const { pelanggan_id, items = [], metode_pembayaran = "Cash", catatan = "" } = orderData || {};

    if (!pelanggan_id) {
      throw new Error("Pengguna belum login.");
    }

    if (!items || items.length === 0) {
      throw new Error("Keranjang masih kosong.");
    }

    const details = items.map((item) => {
      const menu_id = item.menu_id ?? item.id;
      const jumlah = Number(item.jumlah ?? item.qty ?? 1);
      const harga_satuan = Number(
        item.harga_satuan ?? item.harga ?? item.price ?? 0
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

    // 1. Simpan pesanan utama
    const { data: order, error: orderError } = await supabase
      .from("pesanan")
      .insert([
        {
          pelanggan_id,
          kode_pesanan,
          total_harga,
          status: initialStatus,
          catatan,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderId = order.id;

    // 2. Simpan detail pesanan
    const detailItems = details.map((d) => ({
      pesanan_id: orderId,
      menu_id: d.menu_id,
      jumlah: d.jumlah,
      harga_satuan: d.harga_satuan,
    }));

    const { error: detailError } = await supabase
      .from("detail_pesanan")
      .insert(detailItems);

    if (detailError) throw detailError;

    // 3. Simpan pembayaran (DIPERBAIKI: Menghapus 'total_pembayaran' yang tidak ada di skema tabel)
    const { error: paymentError } = await supabase
      .from("pembayaran")
      .insert([
        {
          pesanan_id: orderId,
          metode_pembayaran,
          status_pembayaran: isQris ? "Lunas" : "Belum Lunas",
        },
      ]);

    if (paymentError) throw paymentError;

    // 4. Otomatis memotong stok bahan baku di gudang
    for (const item of details) {
      const { data: menuData } = await supabase
        .from("menus")
        .select(`
          pcs_per_adonan,
          pcs_per_porsi,
          menu_bahan_baku (
            bahan_id,
            jumlah_dibutuhkan
          )
        `)
        .eq("id", item.menu_id)
        .single();

      if (menuData && menuData.menu_bahan_baku) {
        const pcsAdonan = Number(menuData.pcs_per_adonan || 1);
        const pcsPorsi = Number(menuData.pcs_per_porsi || 1);

        for (const resep of menuData.menu_bahan_baku) {
          const bahanId = resep.bahan_id;
          const bahanPerAdonan = Number(resep.jumlah_dibutuhkan || 0);

          const butuhPerPorsi = (bahanPerAdonan * pcsPorsi) / pcsAdonan;
          const totalPotong = butuhPerPorsi * item.jumlah;

          const { data: stokCurrent } = await supabase
            .from("stok_bahan_baku")
            .select("jumlah_stok")
            .eq("id", bahanId)
            .single();

          if (stokCurrent) {
            const sisaStok = Math.max(0, Number(stokCurrent.jumlah_stok || 0) - totalPotong);

            await supabase
              .from("stok_bahan_baku")
              .update({
                jumlah_stok: sisaStok,
                updated_at: new Date().toISOString(),
              })
              .eq("id", bahanId);
          }
        }
      }
    }

    return { data: order, error: null };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}
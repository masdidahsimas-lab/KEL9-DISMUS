import { useEffect, useState } from "react";
import { Clock, ShoppingBag, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { rupiah, tanggal } from "../../utils/format";

export default function CustomerHistory({ onNavigate }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Ambil data dari tabel 'pesanan' relasi ke 'detail_pesanan' (menu) & 'pembayaran'
      const { data, error } = await supabase
        .from("pesanan")
        .select(`
          *,
          detail_pesanan (
            id,
            jumlah,
            harga_satuan,
            subtotal,
            menus (
              nama_menu
            )
          ),
          pembayaran (
            metode_pembayaran,
            status_pembayaran
          )
        `)
        .eq("pelanggan_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching history:", error);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Catch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-stone-500">
        <Clock className="animate-spin text-amber-600" size={30} />
        <p className="text-sm">Memuat riwayat transaksi...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-black text-stone-800 sm:text-3xl">
          Riwayat Pembelian Saya
        </h1>
        <p className="mt-1 text-xs text-stone-500 sm:text-sm">
          Daftar seluruh pesanan dimsum yang pernah Anda buat.
        </p>
      </div>

      {!user ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <AlertCircle size={20} className="shrink-0" />
          <span>Silakan login terlebih dahulu untuk melihat riwayat pesanan Anda.</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800">Belum Ada Riwayat Pesanan</h3>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Anda belum melakukan pemesanan dimsum. Yuk, pilih menu favoritmu sekarang!
          </p>
          <button
            onClick={() => onNavigate?.("katalog")}
            className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
          >
            Pesan Dimsum Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const metodeBayar = order.pembayaran?.[0]?.metode_pembayaran;

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* Header Pesanan */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <span className="font-mono text-base font-extrabold text-stone-800">
                      {order.kode_pesanan || `#${order.id}`}
                    </span>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {tanggal(order.tanggal_pesanan || order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {metodeBayar && (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-600">
                        {metodeBayar}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        order.status === "Selesai"
                          ? "bg-emerald-50 text-emerald-700"
                          : order.status === "Dibatalkan"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {order.status || "Pending"}
                    </span>
                  </div>
                </div>

                {/* Rincian Menu */}
                <div className="space-y-2 text-xs text-stone-600">
                  {order.detail_pesanan && order.detail_pesanan.length > 0 ? (
                    order.detail_pesanan.map((item, idx) => {
                      const namaMenu = item.menus?.nama_menu || "Menu Dimsum";
                      const harga = item.harga_satuan || 0;
                      const qty = item.jumlah || 1;

                      return (
                        <div key={idx} className="flex items-center justify-between">
                          <span>
                            <strong className="text-stone-800">{namaMenu}</strong> x{qty}
                          </span>
                          <span className="font-semibold text-stone-700">
                            {rupiah(harga * qty)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="italic text-stone-400 text-[11px]">Tidak ada rincian item.</p>
                  )}
                </div>

                {/* Catatan Pesanan */}
                {order.catatan && (
                  <div className="mt-3 rounded-xl border border-stone-100 bg-stone-50 p-2.5 text-[11px] text-stone-500">
                    <span className="font-bold text-stone-700">Catatan:</span> {order.catatan}
                  </div>
                )}

                {/* Total Bayar */}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs sm:text-sm">
                  <span className="font-bold text-stone-600">Total Pembayaran</span>
                  <span className="text-base font-black text-amber-600">
                    {rupiah(order.total_harga || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
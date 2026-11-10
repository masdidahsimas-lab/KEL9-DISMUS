import React, { useState } from "react";
import {
  Utensils,
  ShoppingBag,
  Clock,
  Sparkles,
  Plus,
  Check,
  ChevronRight,
  Flame,
  Star,
  ArrowRight,
} from "lucide-react";

import { useCart } from "../../context/CartContext";
import { rupiah } from "../../utils/format";

export default function DashboardCust({
  menus = [],
  orders = [],
  user = null,
  onNavigate,
}) {
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState(null);

  // Ambil nama pelanggan
  const displayName =
    user?.user_metadata?.full_name ||
    user?.profile?.nama_lengkap ||
    user?.email?.split("@")[0] ||
    "Pencinta Dimsum";

  // Ambil 4 menu rekomendasi / highlight terbaik dari database
  const highlightMenus = menus
    .filter((item) => item.tersedia !== false)
    .slice(0, 4);

  // Hitung pesanan pelanggan yang sedang aktif diproses
  const activeOrders = orders.filter(
    (order) => order.status !== "Selesai" && order.status !== "Dibatalkan"
  );

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.nama_menu,
      price: item.harga,
      kategori: item.kategori,
    });

    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="space-y-8">
      {/* 1. Hero Banner Pelanggan Estetik */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 sm:p-8 text-white shadow-xl shadow-amber-500/10">
        <div className="relative z-10 max-w-lg space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
            <Sparkles size={14} className="text-amber-200" />
            <span>Spesial Untukmu Hari Ini</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            Halo, {displayName}! 🥟
          </h1>

          <p className="text-xs text-amber-100/90 sm:text-sm leading-relaxed">
            Lapar? Pilih dimsum favoritmu yang dibuat segar dan hangat langsung dari dapur kami!
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("katalog")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-amber-800 shadow-md transition-all duration-300 hover:bg-amber-50 hover:shadow-lg active:scale-95"
            >
              <Utensils size={16} />
              <span>Pesan Dimsum Sekarang</span>
            </button>
          </div>
        </div>

        {/* Ornamen Grafis Dimsum */}
        <div className="absolute -bottom-8 -right-6 text-9xl opacity-20 pointer-events-none select-none">
          🥟
        </div>
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 2. Ringkasan Aktivitas Pelanggan (Pesanan Aktif & Riwayat) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Pesanan Aktif */}
        <div
          onClick={() => onNavigate("riwayat")}
          className="group cursor-pointer rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-400">Pesanan Sedang Diproses</span>
              <p className="text-lg font-black text-stone-800">
                {activeOrders.length > 0 ? `${activeOrders.length} Pesanan Aktif` : "Tidak ada pesanan aktif"}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-stone-400 group-hover:translate-x-1 transition" />
        </div>

        {/* Akses Cepat Keranjang / Katalog */}
        <div
          onClick={() => onNavigate("katalog")}
          className="group cursor-pointer rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <ShoppingBag size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-stone-400">Menu Dimsum</span>
              <p className="text-lg font-black text-stone-800">{menus.length} Varian Lezat</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-stone-400 group-hover:translate-x-1 transition" />
        </div>
      </div>

      {/* 3. Section Highlight Menu Favorit (Quick Add to Cart) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="text-amber-600" size={20} />
            <h2 className="text-lg font-black text-stone-800">Rekomendasi Favorit</h2>
          </div>
          <button
            onClick={() => onNavigate("katalog")}
            className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
          >
            Lihat Semua <ArrowRight size={14} />
          </button>
        </div>

        {highlightMenus.length === 0 ? (
          <p className="text-xs text-stone-400 italic">Menu rekomendasi belum tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {highlightMenus.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative mb-3 flex h-36 w-full items-center justify-center rounded-2xl bg-amber-50/70 text-5xl">
                    <span>🥟</span>
                    <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 backdrop-blur-sm shadow-sm">
                      <Star size={12} className="fill-amber-500 text-amber-500" /> Popular
                    </span>
                  </div>

                  {/* Item Info */}
                  <h3 className="font-bold text-stone-800 group-hover:text-amber-600 transition text-sm">
                    {item.nama_menu}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                    {item.deskripsi || "Dimsum olahan daging segar gurih & nikmat."}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div>
                    <span className="block text-[10px] font-semibold text-stone-400">Harga</span>
                    <span className="text-sm font-black text-amber-600">
                      {rupiah(item.harga || 0)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      addedId === item.id
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 text-white hover:bg-amber-700 active:scale-95"
                    }`}
                  >
                    {addedId === item.id ? (
                      <>
                        <Check size={14} /> Masuk
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Pesan
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
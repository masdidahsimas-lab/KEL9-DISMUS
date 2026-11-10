import React from "react";
import {
  Coffee,
  ShoppingBag,
  CircleDollarSign,
  Boxes,
  BarChart3,
  Clock3,
} from "lucide-react";

import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import DashboardChart from "../components/DashboardChart";
import { rupiah, tanggal } from "../utils/format";

export default function Dashboard({
  userRole = "manajer",
  menus = [],
  orders = [], // Menerima prop orders dari App.jsx
  pesanan = orders, // Fallback otomatis ke orders jika pesanan tidak dioper
  stock = [],
  onNavigate,
}) {
  // Gunakan data orders yang valid
  const orderList = pesanan.length > 0 ? pesanan : orders;

  // Filter pesanan masuk hari ini
  const today = new Date();
  const todayPesanan = orderList.filter((o) => {
    const d = new Date(o.tanggal_pesanan || o.created_at);
    return d.toDateString() === today.toDateString();
  });

  // Filter pesanan status 'Selesai' & hitung total pendapatan
  const doneOrders = orderList.filter((o) => o.status === "Selesai");
  const revenue = doneOrders.reduce(
    (sum, o) => sum + Number(o.total_harga || o.total_amount || 0),
    0
  );

  // Filter pesanan aktif yang perlu diproses/ditangani
  const activeOrdersCount = orderList.filter((o) =>
    ["Menunggu", "Dikonfirmasi", "Diproses", "Pending"].includes(o.status)
  ).length;

  // Filter stok bahan baku yang menipis (<= 5)
  const lowStock = stock.filter(
    (s) => Number(s.jumlah_stok ?? s.jumlah ?? s.stok ?? 0) <= 5
  );

  // Take 5 pesanan terbaru berdasarkan waktu pembuatan
  const latestOrders = [...orderList]
    .sort((a, b) => new Date(b.created_at || b.tanggal_pesanan) - new Date(a.created_at || a.tanggal_pesanan))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Banner Hero dengan Identitas Role */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-rose-500 p-6 text-white sm:p-9 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-md">
            Dashboard {userRole}
          </span>
          <span className="text-xs bg-black/20 px-3 py-1 rounded-full text-rose-100 backdrop-blur-md">
            Sistem aktif sebagai:{" "}
            <strong className="capitalize text-white">{userRole}</strong>
          </span>
        </div>

        <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">
          Semua urusan dimsum,
          <br />
          lebih mudah dikelola.
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-rose-50 text-xs sm:text-sm">
          Pantau pesanan, kelola menu, dan periksa stok bahan baku dari satu tempat.
        </p>

        <button
          onClick={() => onNavigate && onNavigate("pesanan")}
          className="mt-6 min-h-11 rounded-2xl bg-white px-5 text-xs font-bold text-brand-700 hover:bg-stone-100 transition shadow-md active:scale-95"
        >
          Lihat pesanan →
        </button>
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full border-[35px] border-white/10" />
      </section>

      {/* Ringkasan Statistik */}
      <section>
        <h2 className="mb-4 text-xl font-extrabold text-stone-800">
          Ringkasan Penjualan & Operasional
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pesanan hari ini"
            value={todayPesanan.length}
            icon={ShoppingBag}
            note="Pesanan masuk hari ini"
          />
          <StatCard
            label="Perlu ditangani"
            value={activeOrdersCount}
            icon={Clock3}
            note="Status aktif / belum selesai"
          />
          <StatCard
            label="Pendapatan selesai"
            value={rupiah(revenue)}
            icon={CircleDollarSign}
            note={`${doneOrders.length} pesanan selesai`}
          />
          <StatCard
            label="Menu tersedia"
            value={menus.filter((m) => m.tersedia !== false).length}
            icon={Coffee}
            note={`${menus.length} total menu terdaftar`}
          />
        </div>
      </section>

      {/* Visualisasi Grafik Chart */}
      <section>
        <DashboardChart orders={orderList} />
      </section>

      {/* Detail Pesanan Terbaru & Akses Stok */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Pesanan Terbaru */}
        <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 p-5">
            <div>
              <h2 className="font-extrabold text-stone-800">Pesanan Terbaru</h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Transaksi terbaru masuk dari sistem
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate("pesanan")}
              className="text-xs font-bold text-brand-700 hover:underline"
            >
              Lihat semua →
            </button>
          </div>

          {latestOrders.length === 0 ? (
            <EmptyState
              title="Belum ada pesanan"
              description="Pesanan baru dari pelanggan akan muncul di sini."
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {latestOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center hover:bg-stone-50/50 transition"
                >
                  <div>
                    <b className="text-sm text-stone-800">
                      {o.kode_pesanan || `#${o.id}`}
                    </b>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {tanggal(o.tanggal_pesanan || o.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <b className="text-sm text-amber-600">
                      {rupiah(o.total_harga || o.total_amount || 0)}
                    </b>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Stok & Akses Cepat */}
        <div className="space-y-5">
          {/* Section Stok */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                <Boxes size={20} />
              </div>
              <h2 className="font-extrabold text-stone-800">Stok Perlu Dicek</h2>
            </div>

            <p className="mt-4 text-3xl font-black text-stone-800">
              {lowStock.length}{" "}
              <span className="text-xs font-semibold text-stone-500">
                bahan menipis (≤ 5)
              </span>
            </p>

            {lowStock.length === 0 ? (
              <p className="mt-3 text-xs text-stone-400 italic">
                Semua stok bahan baku masih mencukupi.
              </p>
            ) : (
              lowStock.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="mt-3 flex items-center justify-between rounded-2xl bg-rose-50/80 p-3 text-xs text-rose-900 font-medium border border-rose-100"
                >
                  <span>{s.nama_bahan || s.nama}</span>
                  <b className="font-bold">
                    {s.jumlah_stok ?? s.jumlah ?? s.stok ?? 0} {s.satuan || "pcs"}
                  </b>
                </div>
              ))
            )}

            <button
              onClick={() => onNavigate && onNavigate("stok")}
              className="mt-4 min-h-11 w-full rounded-2xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition active:scale-95"
            >
              Kelola Stok Bahan →
            </button>
          </section>

          {/* Akses Cepat */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <h2 className="font-extrabold text-stone-800 text-sm">
              Pintasan Menu
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate && onNavigate("menus")}
                className="flex min-h-[90px] flex-col justify-between rounded-2xl bg-amber-50/70 p-4 text-left text-xs font-bold text-amber-900 border border-amber-200/50 hover:bg-amber-100/70 transition"
              >
                <Coffee size={20} className="text-amber-700" />
                <span>Kelola Menu</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate("laporan")}
                className="flex min-h-[90px] flex-col justify-between rounded-2xl bg-stone-100/70 p-4 text-left text-xs font-bold text-stone-800 border border-stone-200/50 hover:bg-stone-200/70 transition"
              >
                <BarChart3 size={20} className="text-stone-700" />
                <span>Laporan</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
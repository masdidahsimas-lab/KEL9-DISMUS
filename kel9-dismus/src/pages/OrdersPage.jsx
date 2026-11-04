import React, { useMemo, useState } from "react";
import {
  Search,
  QrCode,
  Banknote,
  Clock,
  CheckCircle2,
  ArrowRight,
  Filter,
  Sparkles,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";

import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { rupiah, tanggal } from "../utils/format";

const STATUS_OPTIONS = [
  "Menunggu",
  "Dikonfirmasi",
  "Diproses",
  "Selesai",
  "Dibatalkan",
];

// Pemetaan alur status berikutnya (Termasuk penanganan status 'Pending')
const NEXT_STATUS_MAP = {
  Pending: "Dikonfirmasi",
  Menunggu: "Dikonfirmasi",
  Dikonfirmasi: "Diproses",
  Diproses: "Selesai",
};

// Helper Ekstrak Metode Pembayaran dari Object / Relasi Array Supabase
const getPaymentMethod = (order) => {
  if (order.metode_pembayaran) return order.metode_pembayaran;

  if (Array.isArray(order.pembayaran) && order.pembayaran.length > 0) {
    return order.pembayaran[0].metode_pembayaran || "Cash";
  }

  if (order.pembayaran && typeof order.pembayaran === "object") {
    return order.pembayaran.metode_pembayaran || "Cash";
  }

  return "Cash";
};

export default function OrdersPage({ orders = [], onStatus, onError }) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterPayment, setFilterPayment] = useState("Semua");
  const [updatingId, setUpdatingId] = useState(null);

  // Filter Data Pesanan
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const method = getPaymentMethod(o);
      const matchQuery =
        `${o.kode_pesanan || ""} ${o.status || ""} ${o.catatan || ""} ${method}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchStatus =
        filterStatus === "Semua" ||
        o.status === filterStatus ||
        (filterStatus === "Menunggu" && o.status === "Pending");

      const matchPayment =
        filterPayment === "Semua" ||
        method.toLowerCase().includes(filterPayment.toLowerCase());

      return matchQuery && matchStatus && matchPayment;
    });
  }, [orders, query, filterStatus, filterPayment]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    return {
      total: orders.length,
      menunggu: orders.filter((o) => ["Menunggu", "Pending"].includes(o.status)).length,
      dikonfirmasi: orders.filter((o) => o.status === "Dikonfirmasi").length,
      diproses: orders.filter((o) => o.status === "Diproses").length,
      selesai: orders.filter((o) => o.status === "Selesai").length,
    };
  }, [orders]);

  async function handleStatusChange(order, newStatus) {
    if (!onStatus || newStatus === order.status) return;

    setUpdatingId(order.id);
    try {
      await onStatus(order, newStatus);
    } catch (error) {
      onError?.(`Gagal memperbarui status pesanan: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
            <Sparkles size={13} /> Panel Kelola Pesanan
          </div>
          <h1 className="mt-1 text-2xl font-black text-stone-800 sm:text-3xl">
            Daftar Pesanan
          </h1>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Pantau pembayaran, konfirmasi pesanan masuk, dan perbarui status dapur secara real-time.
          </p>
        </div>
      </div>

      {/* Ringkasan Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Perlu Dikonfirmasi
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600">
              {stats.menunggu}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Sudah Dikonfirmasi
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-blue-600">
              {stats.dikonfirmasi}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Sedang Diproses
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-orange-600">
              {stats.diproses}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <RotateCcw size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Pesanan Selesai
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {stats.selesai}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="flex flex-col gap-3 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-stone-400" size={18} />
          <input
            type="text"
            className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-xs font-medium text-stone-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            placeholder="Cari kode pesanan, catatan, atau metode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600">
            <Filter size={14} className="text-stone-400" />
            <select
              className="bg-transparent outline-none cursor-pointer font-bold text-stone-700"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Semua">Semua Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600">
            <select
              className="bg-transparent outline-none cursor-pointer font-bold text-stone-700"
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
            >
              <option value="Semua">Semua Pembayaran</option>
              <option value="QRIS">QRIS</option>
              <option value="Cash">Cash / Tunai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Utama Pesanan */}
      <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
        {filteredOrders.length === 0 ? (
          <EmptyState
            title="Tidak Ada Pesanan Ditemukan"
            description="Coba ubah kata kunci pencarian atau filter status pesanan Anda."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="bg-stone-100/70 font-extrabold text-stone-600 uppercase tracking-wider border-b border-stone-200/60">
                <tr>
                  <th className="px-5 py-4">Kode Pesanan</th>
                  <th className="px-5 py-4">Waktu Transaksi</th>
                  <th className="px-5 py-4">Metode Bayar</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status Saat Ini</th>
                  <th className="px-5 py-1 text-right pr-28">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 bg-white">
                {filteredOrders.map((o) => {
                  const paymentMethod = getPaymentMethod(o);
                  const isQris = paymentMethod.toUpperCase().includes("QRIS");
                  const nextStatus = NEXT_STATUS_MAP[o.status];

                  return (
                    <tr
                      key={o.id}
                      className="transition hover:bg-stone-50/70"
                    >
                      <td className="px-5 py-4">
                        <span className="font-extrabold text-stone-800">
                          {o.kode_pesanan || `#${o.id}`}
                        </span>
                        {o.catatan && (
                          <p className="mt-0.5 text-[11px] text-stone-400 italic line-clamp-1">
                            Catatan: {o.catatan}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-stone-600 font-medium whitespace-nowrap">
                        {tanggal(o, true)}
                      </td>

                      {/* Badge Metode Pembayaran */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isQris ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                            <QrCode size={13} className="text-amber-600" />
                            QRIS Instant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                            <Banknote size={13} className="text-emerald-600" />
                            Cash / Tunai
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-black text-amber-600 text-sm whitespace-nowrap">
                        {rupiah(o.total_harga || o.total_amount || 0)}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={o.status} />
                      </td>

                      {/* Tombol Pintasan Alur + Dropdown Select */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {nextStatus && (
                            <button
                              type="button"
                              disabled={updatingId === o.id}
                              onClick={() => handleStatusChange(o, nextStatus)}
                              className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 disabled:opacity-50 shrink-0"
                              title={`Ubah langsung ke status ${nextStatus}`}
                            >
                              <span>{nextStatus}</span>
                              <ArrowRight size={12} />
                            </button>
                          )}

                          <select
                            className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-stone-700 outline-none transition focus:border-amber-500 disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
                            value={o.status === "Pending" ? "Menunggu" : (o.status || "Menunggu")}
                            disabled={updatingId === o.id}
                            onChange={(e) =>
                              handleStatusChange(o, e.target.value)
                            }
                            aria-label={`Ubah status pesanan ${o.id}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
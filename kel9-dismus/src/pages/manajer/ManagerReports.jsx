import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Calendar,
  Download,
  TrendingUp,
  ShoppingBag,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";

import { getReportData } from "../../services/reportService";
import { supabase } from "../../lib/supabase";
import { rupiah, tanggal } from "../../utils/format";

// --- Helper Ekstra Aman: Konversi Tanggal ke Angka Absolut (YYYYMMDD) ---
function getOrderYYYYMMDD(val) {
  if (!val) return 0;
  let d = new Date(val);
  if (isNaN(d.getTime())) d = new Date(Number(val));
  if (isNaN(d.getTime())) {
    if (typeof val === "string") {
      const parts = val.split(/[-/]/);
      if (parts.length === 3 && parts[2].length === 4) {
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
  }
  if (isNaN(d.getTime())) return 0;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return Number(`${y}${m}${day}`);
}

function getInputYYYYMMDD(dateStr) {
  if (!dateStr) return 0;
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
    return Number(dateStr.replace(/-/g, ""));
  }
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return Number(`${parts[2]}${parts[1]}${parts[0]}`);
  }
  return 0;
}
// ----------------------------------------------------------------------

export default function ManagerReports({ orders: initialOrders = [] }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedOrders, setFetchedOrders] = useState(null);

  // 1. Fungsi Mengambil Data Laporan dari Supabase
  const fetchReport = async (start = startDate, end = endDate) => {
    setLoading(true);
    try {
      const data = await getReportData(start || null, end || null);
      if (data && data.orders) {
        setFetchedOrders(data.orders);
      } else {
        setFetchedOrders([]);
      }
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Laporan",
        text: err.message || "Terjadi kesalahan saat mengambil data pesanan.",
        confirmButtonColor: "#d97706",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Load data awal & Realtime Subscription Supabase
  useEffect(() => {
    fetchReport(startDate, endDate);

    const channel = supabase
      .channel("manager-reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          fetchReport(startDate, endDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // 3. Filter ketat sisi klien menggunakan angka murni
  const displayOrders = useMemo(() => {
    const rawOrders =
      fetchedOrders !== null ? fetchedOrders : initialOrders || [];

    if (!startDate && !endDate) return rawOrders;

    const startNum = startDate ? getInputYYYYMMDD(startDate) : 0;
    const endNum = endDate ? getInputYYYYMMDD(endDate) : 99999999;

    return rawOrders.filter((item) => {
      const rawDate = item.tanggal_pesanan || item.created_at;
      const orderNum = getOrderYYYYMMDD(rawDate);

      if (orderNum === 0) return false;
      if (startNum > 0 && orderNum < startNum) return false;
      if (endNum < 99999999 && orderNum > endNum) return false;

      return true;
    });
  }, [fetchedOrders, initialOrders, startDate, endDate]);

  // Kalkulasi statistik dari data yang telah terfilter
  const completedOrders = useMemo(
    () => displayOrders.filter((o) => o.status === "Selesai"),
    [displayOrders]
  );

  const revenue = useMemo(
    () =>
      completedOrders.reduce(
        (sum, o) => sum + Number(o.total_harga || 0),
        0
      ),
    [completedOrders]
  );

  // 4. Handler Tombol Filter / Generate Laporan
  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport(startDate, endDate);
  };

  // 5. Handler Ekspor Data Ke File CSV
  const handleDownloadCSV = () => {
    if (displayOrders.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Data Kosong",
        text: "Tidak ada data transaksi pesanan untuk diekspor pada rentang tanggal ini.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const headers = [
      "ID / Kode Pesanan",
      "Tanggal",
      "Status",
      "Total Harga (Rp)",
    ];
    const rows = displayOrders.map((o) => [
      o.kode_pesanan || `#${o.id}`,
      tanggal(o.tanggal_pesanan || o.created_at),
      o.status || "Pending",
      Number(o.total_harga || 0),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...rows]
        .map((e) =>
          e.map((val) => `"${String(val).replaceAll('"', '""')}"`).join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Penjualan_DimsumKu_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Container Utama Laporan */}
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
        {/* Header Laporan */}
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-stone-800 sm:text-2xl">
              Laporan Penjualan Manajer
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              Filter dan tinjau rekap transaksi penjualan restoran DimsumKu.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 shrink-0"
          >
            <Download size={16} />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Form Filter Tanggal */}
        <form
          onSubmit={handleFilter}
          className="mt-6 grid grid-cols-1 items-end gap-4 sm:grid-cols-12"
        >
          <div className="sm:col-span-5">
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Tanggal Mulai <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-xs font-medium text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Tanggal Selesai <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-xs font-medium text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Cetak / Filter</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Summary Metric Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Total Transaksi */}
          <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/80 p-5">
            <div>
              <span className="text-xs font-semibold text-stone-500">
                Total Transaksi
              </span>
              <p className="mt-1 text-2xl font-black text-stone-800">
                {displayOrders.length}{" "}
                <span className="text-xs font-bold text-stone-500">
                  Pesanan
                </span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ShoppingBag size={24} />
            </div>
          </div>

          {/* Total Pendapatan */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <div>
              <span className="text-xs font-semibold text-emerald-700">
                Total Pendapatan (Pesanan Selesai)
              </span>
              <p className="mt-1 text-2xl font-black text-emerald-600">
                {rupiah(revenue)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Pesanan */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/70 font-bold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID / Kode Pesanan</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">
                      <LoaderCircle
                        className="mx-auto mb-2 animate-spin text-amber-600"
                        size={24}
                      />
                      Memuat data laporan...
                    </td>
                  </tr>
                ) : displayOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">
                      <FileText className="mx-auto mb-2 opacity-40" size={36} />
                      <p className="font-semibold text-stone-600">
                        Tidak ada transaksi
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Tidak ada pesanan yang ditemukan pada rentang tanggal tersebut.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="transition hover:bg-stone-50/60"
                    >
                      <td className="px-5 py-3.5 font-bold text-stone-800">
                        {o.kode_pesanan || `#${o.id}`}
                      </td>
                      <td className="px-5 py-3.5 text-stone-600">
                        {tanggal(o.tanggal_pesanan || o.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            o.status === "Selesai"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.status === "Diproses"
                              ? "bg-amber-100 text-amber-800"
                              : o.status === "Dibatalkan"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {o.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-amber-600">
                        {rupiah(o.total_harga || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
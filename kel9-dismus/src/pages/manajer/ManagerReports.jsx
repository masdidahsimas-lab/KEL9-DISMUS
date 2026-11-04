import React, { useState, useEffect } from "react";
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
import { rupiah, tanggal } from "../../utils/format";

export default function ManagerReports({ orders: initialOrders = [] }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    orders: [],
    totalOrders: 0,
    completedCount: 0,
    revenue: 0,
  });

  // 1. Fungsi Mengambil Data Laporan dari Supabase
  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getReportData(startDate || null, endDate || null);
      
      // Jika dari database ada data, gunakan data tersebut
      if (data && data.orders && data.orders.length > 0) {
        setReportData(data);
      } else if (initialOrders && initialOrders.length > 0) {
        // Fallback ke data orders dari props App.jsx jika ada
        const completed = initialOrders.filter((o) => o.status === "Selesai");
        const totalRev = completed.reduce(
          (sum, o) => sum + Number(o.total_harga || 0),
          0
        );
        setReportData({
          orders: initialOrders,
          totalOrders: initialOrders.length,
          completedCount: completed.length,
          revenue: totalRev,
        });
      } else {
        setReportData(data);
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

  // 2. Load data secara otomatis saat halaman pertama kali diakses
  useEffect(() => {
    fetchReport();
  }, []);

  // 3. Handler Tombol Filter / Generate Laporan
  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // 4. Handler Ekspor Data Ke File CSV
  const handleDownloadCSV = () => {
    if (reportData.orders.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Data Kosong",
        text: "Tidak ada data transaksi pesanan untuk diekspor.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const headers = ["ID / Kode Pesanan", "Tanggal", "Status", "Total Harga (Rp)"];
    const rows = reportData.orders.map((o) => [
      o.kode_pesanan || `#${o.id}`,
      tanggal(o.tanggal_pesanan || o.created_at),
      o.status || "Pending",
      Number(o.total_harga || 0),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...rows]
        .map((e) => e.map((val) => `"${String(val).replaceAll('"', '""')}"`).join(","))
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
              Tanggal Mulai
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-xs font-medium text-stone-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Tanggal Selesai
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="date"
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
                {reportData.totalOrders}{" "}
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
                {rupiah(reportData.revenue)}
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
                ) : reportData.orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">
                      <FileText className="mx-auto mb-2 opacity-40" size={36} />
                      <p className="font-semibold text-stone-600">
                        Belum ada transaksi
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Pesanan yang dibuat oleh pelanggan akan otomatis muncul di sini.
                      </p>
                    </td>
                  </tr>
                ) : (
                  reportData.orders.map((o) => (
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
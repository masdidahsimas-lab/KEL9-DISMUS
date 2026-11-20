import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, TrendingUp, RefreshCw, Download } from "lucide-react";
import { getReportData } from "../services/reportService";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { rupiah, tanggal } from "../utils/format";
import { supabase } from "../lib/supabase";

// --- Helper Ekstra Aman (Konversi Tanggal ke Angka YYYYMMDD) ---
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
// -------------------------------------------------------------

export default function ReportsPage({ orders: propsOrders }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fetchedOrders, setFetchedOrders] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async (start = startDate, end = endDate) => {
    setLoading(true);
    try {
      const res = await getReportData(start, end);
      setFetchedOrders(res.orders);
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load awal & Realtime listener untuk laporan penjualan
  useEffect(() => {
    loadData(startDate, endDate);

    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          loadData(startDate, endDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate]);

  const rawOrders = fetchedOrders !== null ? fetchedOrders : propsOrders || [];

  // Filter reaktif sisi UI menggunakan angka matematika (sangat ketat)
  const displayOrders = useMemo(() => {
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
  }, [rawOrders, startDate, endDate]);

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

  const handleFilterClick = (e) => {
    e.preventDefault();
    loadData(startDate, endDate);
  };

  function downloadCSV() {
    if (displayOrders.length === 0) return;
    const headers = ["Kode Pesanan", "Tanggal", "Status", "Total Harga"];
    const rows = displayOrders.map((o) => [
      o.kode_pesanan || `#${o.id}`,
      tanggal(o.tanggal_pesanan || o.created_at),
      o.status || "",
      Number(o.total_harga || 0),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-penjualan.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900">
            Laporan Penjualan Manajer
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Filter dan tinjau rekap transaksi penjualan restoran DimsumKu.
          </p>
        </div>

        <button
          onClick={downloadCSV}
          disabled={displayOrders.length === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download size={18} />
          Ekspor CSV
        </button>
      </div>

      <form
        onSubmit={handleFilterClick}
        className="flex flex-wrap items-end gap-4 rounded-2xl border bg-white p-5 shadow-sm"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Tanggal Mulai
          </label>
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Tanggal Selesai
          </label>
          <input
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Memuat..." : "Cetak / Filter"}
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-medium text-stone-500">Total Transaksi</p>
            <p className="mt-2 text-2xl font-extrabold text-stone-900">
              {displayOrders.length}{" "}
              <span className="text-sm font-normal text-stone-500">Pesanan</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border bg-emerald-50/40 border-emerald-100 p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-emerald-700">
              Total Pendapatan (Pesanan Selesai)
            </p>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600">
              {rupiah(revenue)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {displayOrders.length === 0 ? (
          <EmptyState
            title="Tidak ada riwayat pesanan"
            description="Tidak ada transaksi yang ditemukan pada rentang tanggal tersebut."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-6 py-4">ID / Kode Pesanan</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y text-stone-700">
                {displayOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4 font-bold">
                      {o.kode_pesanan || `#${o.id}`}
                    </td>
                    <td className="px-6 py-4">
                      {tanggal(o.tanggal_pesanan || o.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-600">
                      {rupiah(o.total_harga)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
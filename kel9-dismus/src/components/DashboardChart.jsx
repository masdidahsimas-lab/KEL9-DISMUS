import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { rupiah } from "../utils/format";

// Helper mengekstrak label tanggal murni (mencegah pergeseran timezone UTC+7)
const formatChartLabel = (rawDateInput) => {
  if (!rawDateInput) return "-";
  const strDate = String(rawDateInput).trim();
  const datePart = strDate.includes("T")
    ? strDate.split("T")[0]
    : strDate.split(" ")[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(rawDateInput));
};

export default function DashboardChart({ orders = [] }) {
  const [fetchedOrders, setFetchedOrders] = useState([]);

  useEffect(() => {
    if (orders.length === 0) {
      loadSalesStats();
    }
  }, [orders]);

  const loadSalesStats = async () => {
    try {
      const { data, error } = await supabase
        .from("pesanan")
        .select("created_at, tanggal_pesanan, total_harga, status")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setFetchedOrders(data);
      }
    } catch (err) {
      console.error("Gagal memuat data grafik:", err);
    }
  };

  const sourceOrders = orders.length > 0 ? orders : fetchedOrders;

  // Mengolah data transaksi menjadi grafik harian yang akurat
  const chartData = useMemo(() => {
    if (!sourceOrders || sourceOrders.length === 0) return [];

    const grouped = sourceOrders.reduce((acc, curr) => {
      // Abaikan pesanan yang dibatalkan
      if (curr.status === "Dibatalkan") return acc;

      const rawDate = curr.tanggal_pesanan || curr.created_at;
      const dateLabel = formatChartLabel(rawDate);

      const amount = Number(curr.total_harga || curr.total_amount || 0);
      acc[dateLabel] = (acc[dateLabel] || 0) + amount;
      return acc;
    }, {});

    return Object.keys(grouped)
      .map((key) => ({
        label: key,
        value: grouped[key],
      }))
      .slice(-7); // Ambil 7 periode transaksi terakhir
  }, [sourceOrders]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 100000);

  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-800">
            Grafik Penjualan Harian
          </h3>
          <p className="mt-0.5 text-xs text-stone-400">
            Ringkasan pendapatan dari transaksi aktif & selesai
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-44 items-center justify-center rounded-2xl bg-stone-50 text-xs font-semibold text-stone-400 border border-dashed border-stone-200">
          Belum ada data grafik transaksi.
        </div>
      ) : (
        <div className="flex h-48 items-end gap-3 border-b border-stone-100 pb-3 pt-6">
          {chartData.map((item, index) => {
            const heightPercent = Math.min((item.value / maxValue) * 100, 100);
            return (
              <div
                key={index}
                className="group flex flex-1 flex-col items-center justify-end h-full"
              >
                {/* Tooltip Hover Nominal Transaksi */}
                <span className="mb-1 rounded-md bg-stone-800 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-sm whitespace-nowrap">
                  {rupiah(item.value)}
                </span>

                {/* Batang Grafik */}
                <div
                  style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  className="w-full rounded-t-xl bg-amber-500 transition-all duration-300 group-hover:bg-amber-600 shadow-sm"
                />

                {/* Label Tanggal */}
                <span className="mt-2 text-[10px] font-bold text-stone-500 truncate max-w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { useMemo } from "react";
import { BarChart3, CircleDollarSign, CheckCircle2, Download } from "lucide-react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { rupiah, tanggal } from "../utils/format";

export default function ReportsPage({ orders }) {
  const done = useMemo(() => orders.filter((o) => o.status === "Selesai"), [orders]);
  const revenue = done.reduce((sum, o) => sum + Number(o.total_harga || 0), 0);

  function download() {
    const data = [
      ["Kode Pesanan", "Tanggal", "Status", "Total Harga"],
      ...orders.map((o) => [
        o.kode_pesanan || "",
        tanggal(o.tanggal_pesanan || o.created_at),
        o.status || "",
        Number(o.total_harga || 0),
      ]),
    ];

    const csv = data
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-kel9-dismus.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Laporan Penjualan</h2>
          <p className="mt-2 text-stone-500">Ringkasan berdasarkan pesanan yang tersimpan.</p>
        </div>
        <button
          onClick={download}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 font-bold text-white"
        >
          <Download size={18} /> Ekspor CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Pendapatan pesanan selesai"
          value={rupiah(revenue)}
          icon={CircleDollarSign}
          note="Status pesanan Selesai"
        />
        <StatCard label="Pesanan selesai" value={done.length} icon={CheckCircle2} note="Jumlah pesanan selesai" />
      </div>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-soft">
        <div className="border-b p-5">
          <h3 className="font-extrabold">Riwayat pesanan</h3>
        </div>

        {orders.length === 0 ? (
          <EmptyState title="Belum ada laporan" description="Laporan terisi setelah pesanan tersedia." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="bg-stone-50 text-sm text-stone-500">
                <tr>
                  {[
                    "Kode pesanan",
                    "Tanggal",
                    "Status",
                    "Total",
                  ].map((header) => (
                    <th key={header} className="px-5 py-4">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-4 font-bold">{o.kode_pesanan || `#${o.id}`}</td>
                    <td className="px-5 py-4">{tanggal(o.tanggal_pesanan || o.created_at)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-4 font-bold">{rupiah(o.total_harga)}</td>
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
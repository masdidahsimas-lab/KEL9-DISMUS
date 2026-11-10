
const styles = {
  Menunggu: "bg-amber-50 text-amber-700",
  Dikonfirmasi: "bg-blue-50 text-blue-700",
  Diproses: "bg-violet-50 text-violet-700",
  Selesai: "bg-emerald-50 text-emerald-700",
  Dibatalkan: "bg-stone-100 text-stone-600",
};

export default function StatusBadge({ status }) {
  const currentStatus = status?.trim() || "Belum ada status";

  const badgeStyle =
    styles[currentStatus] || "bg-stone-100 text-stone-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${badgeStyle}`}
    >
      {currentStatus}
    </span>
  );
}

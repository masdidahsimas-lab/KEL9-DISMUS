
import { ClipboardList } from "lucide-react";

export default function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
      <div className="rounded-2xl bg-stone-100 p-4 text-stone-400">
        <ClipboardList size={27} strokeWidth={1.8} />
      </div>

      <h3 className="mt-4 font-extrabold text-stone-800">
        {title || "Belum Ada Data"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
        {description || "Belum ada data yang tersedia saat ini."}
      </p>
    </div>
  );
}

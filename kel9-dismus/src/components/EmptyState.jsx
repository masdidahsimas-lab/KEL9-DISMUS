import { ClipboardList } from "lucide-react";

export default function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
      <div className="rounded-2xl bg-stone-100 p-4 text-stone-400">
        <ClipboardList size={27} />
      </div>
      <h3 className="mt-4 font-extrabold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
        {description}
      </p>
    </div>
  );
}
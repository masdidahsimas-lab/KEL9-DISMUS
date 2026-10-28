export default function StatCard({ label, value, icon: Icon, note }) {
  return (
    <section className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-3 break-words text-2xl font-extrabold">{value}</p>
          <p className="mt-2 text-sm text-stone-500">{note}</p>
        </div>

        <div className="h-fit rounded-xl bg-brand-50 p-3 text-brand-600">
          <Icon size={23} />
        </div>
      </div>
    </section>
  );
}
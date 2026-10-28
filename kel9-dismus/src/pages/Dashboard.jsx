import { Coffee, ShoppingBag, CircleDollarSign, Boxes, BarChart3, Clock3 } from "lucide-react";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { rupiah, tanggal } from "../utils/format";

export default function Dashboard({ menus, orders, stock, onNavigate }) {
	const today = new Date();
	const todayOrders = orders.filter((o) => {
		const d = new Date(o.tanggal_pesanan || o.created_at);
		return d.toDateString() === today.toDateString();
	});
	const done = orders.filter((o) => o.status === "Selesai");
	const revenue = done.reduce((sum, o) => sum + Number(o.total_harga || 0), 0);
	const active = orders.filter((o) => ["Menunggu", "Dikonfirmasi", "Diproses"].includes(o.status)).length;
	const low = stock.filter((s) => Number(s.jumlah_stok) <= 5);
	const latest = [...orders]
		.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
		.slice(0, 5);

	return (
		<div className="space-y-8">
			<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-rose-500 p-6 text-white sm:p-9">
				<span className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold">Ringkasan operasional</span>
				<h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">
					Semua urusan dimsum,
					<br />
					lebih mudah dikelola.
				</h2>
				<p className="mt-3 max-w-xl leading-7 text-rose-50">
					Pantau pesanan, kelola menu, dan periksa stok bahan baku dari satu tempat.
				</p>
				<button onClick={() => onNavigate("pesanan")} className="mt-6 min-h-12 rounded-xl bg-white px-5 font-bold text-brand-700">
					Lihat pesanan →
				</button>
				<div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full border-[35px] border-white/10" />
			</section>

			<section>
				<h2 className="mb-4 text-xl font-extrabold">Ringkasan hari ini</h2>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard label="Pesanan hari ini" value={todayOrders.length} icon={ShoppingBag} note="Pesanan masuk hari ini" />
					<StatCard label="Perlu ditangani" value={active} icon={Clock3} note="Belum selesai" />
					<StatCard label="Pendapatan selesai" value={rupiah(revenue)} icon={CircleDollarSign} note={`${done.length} pesanan selesai`} />
					<StatCard label="Menu tersedia" value={menus.filter((m) => m.tersedia).length} icon={Coffee} note={`${menus.length} menu terdaftar`} />
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
				<section className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-soft">
					<div className="flex items-center justify-between border-b p-5">
						<div>
							<h2 className="font-extrabold">Pesanan terbaru</h2>
							<p className="mt-1 text-sm text-stone-500">Data dari Supabase</p>
						</div>
						<button onClick={() => onNavigate("pesanan")} className="text-sm font-bold text-brand-700">
							Lihat semua
						</button>
					</div>

					{latest.length === 0 ? (
						<EmptyState title="Belum ada pesanan" description="Pesanan baru akan muncul di sini." />
					) : (
						<div className="divide-y">
							{latest.map((o) => (
								<div key={o.id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
									<div>
										<b>{o.kode_pesanan || `Pesanan #${o.id}`}</b>
										<p className="mt-1 text-sm text-stone-500">{tanggal(o.tanggal_pesanan || o.created_at)}</p>
									</div>
									<div className="flex items-center justify-between gap-3">
										<b>{rupiah(o.total_harga)}</b>
										<StatusBadge status={o.status} />
									</div>
								</div>
							))}
						</div>
					)}
				</section>

				<div className="space-y-5">
					<section className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft">
						<div className="flex items-center gap-3">
							<Boxes className="text-brand-600" />
							<h2 className="font-extrabold">Stok perlu dicek</h2>
						</div>
						<p className="mt-4 text-3xl font-extrabold">
							{low.length}
							<span className="ml-2 text-base font-semibold text-stone-500">bahan</span>
						</p>
						{low.slice(0, 4).map((s) => (
							<p key={s.id} className="mt-3 flex justify-between rounded-xl bg-amber-50 p-3 text-sm">
								<span>{s.nama_bahan}</span>
								<b>
									{s.jumlah_stok} {s.satuan}
								</b>
							</p>
						))}
						<button onClick={() => onNavigate("stok")} className="mt-4 min-h-11 w-full rounded-xl border font-bold">
							Kelola stok
						</button>
					</section>

					<section className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft">
						<h2 className="font-extrabold">Akses cepat</h2>
						<div className="mt-4 grid grid-cols-2 gap-3">
							<button onClick={() => onNavigate("menus")} className="flex min-h-24 flex-col justify-between rounded-xl bg-brand-50 p-4 text-left font-bold text-brand-800">
								<Coffee />
								Kelola menu
							</button>
							<button onClick={() => onNavigate("laporan")} className="flex min-h-24 flex-col justify-between rounded-xl bg-stone-100 p-4 text-left font-bold">
								<BarChart3 />
								Laporan
							</button>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
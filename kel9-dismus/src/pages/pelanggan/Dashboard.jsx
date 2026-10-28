import { Utensils, ShoppingCart, Package, TrendingUp, UserCheck } from "lucide-react";

export default function Dashboard({ menus = [], orders = [], stock = [], user = null, onNavigate }) {
  // Hitung statistik sederhana dari data database Supabase
  const totalMenus = menus.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total_harga || order.total_amount || 0),
    0
  );
  const lowStockCount = stock.filter((item) => Number(item.jumlah || item.stok || 0) <= 5).length;

  return (
    <div className="space-y-6">
      {/* Banner Ringkasan / Greeting */}
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 font-bold">
            <UserCheck size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-800">
              Selamat Datang, {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin"} 👋
            </h1>
            <p className="text-xs text-stone-500">
              {user ? `Terautentikasi sebagai ${user.email}` : "Mode Pengunjung / Kasir"}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("katalog")}
          className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-amber-700"
        >
          + Buat Pesanan Baru
        </button>
      </div>

      {/* Grid Kartu Statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Menu */}
        <div 
          onClick={() => onNavigate("menus")}
          className="cursor-pointer rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Total Menu</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Utensils size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-stone-800">{totalMenus}</p>
          <span className="text-[11px] text-amber-600 hover:underline">Kelola menu →</span>
        </div>

        {/* Total Pesanan */}
        <div 
          onClick={() => onNavigate("pesanan")}
          className="cursor-pointer rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Pesanan Masuk</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-stone-800">{totalOrders}</p>
          <span className="text-[11px] text-blue-600 hover:underline">Lihat pesanan →</span>
        </div>

        {/* Stok Menipis */}
        <div 
          onClick={() => onNavigate("stok")}
          className="cursor-pointer rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Stok Menipis</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <Package size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-stone-800">{lowStockCount}</p>
          <span className="text-[11px] text-rose-600 hover:underline">Cek bahan baku →</span>
        </div>

        {/* Total Pendapatan */}
        <div 
          onClick={() => onNavigate("laporan")}
          className="cursor-pointer rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Pendapatan</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="mt-3 text-xl font-extrabold text-emerald-600">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
          <span className="text-[11px] text-emerald-600 hover:underline">Lihat laporan →</span>
        </div>
      </div>
    </div>
  );
}
import {
  Coffee,
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  BarChart3,
  X,
  Store,
  Home,
  UserPlus,
  History,
  ShoppingCart,
  Utensils,
} from "lucide-react";

// Navigasi internal staf (Manajer & Karyawan) dengan menu 'Kelola Menu' dan 'Resep Menu' terpisah
const staffLinks = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["menus", "Kelola Menu", Coffee],
  ["resep", "Resep Menu", Utensils],
  ["pesanan", "Pesanan", ShoppingBag],
  ["stok", "Stok Bahan Baku", Boxes],
  ["laporan", "Laporan", BarChart3],
  ["tambah_karyawan", "Tambah Pegawai", UserPlus],
];

const customerLinks = [
  ["katalog", "Katalog", Home],
  ["dashboard", "Dashboard", LayoutDashboard],
  ["checkout", "Checkout", ShoppingCart],
  ["riwayat", "Riwayat Pembelian", History],
];

export default function Sidebar({
  page,
  onNavigate,
  open,
  onClose,
  role = "pelanggan",
}) {
  const isManager = role === "manajer" || role === "manager";
  const isStaff = isManager || role === "karyawan";

  // Role Control: Karyawan dapat melihat 'Kelola Menu' & 'Resep Menu', namun 'Tambah Pegawai' disembunyikan
  const links = isStaff
    ? staffLinks.filter(([id]) => isManager || id !== "tambah_karyawan")
    : customerLinks;

  const handleNavigate = (id) => {
    if (typeof onNavigate === "function") {
      onNavigate(id);
    }

    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <>
      {/* Background Overlay Mobile */}
      {open && (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-stone-100 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo & Identitas Header */}
        <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-6">
          <div className="rounded-2xl bg-brand-600 p-3 text-white">
            <Store size={25} />
          </div>

          <div>
            <b className="text-lg">
              Dimsum<span className="text-brand-600">Ku</span>
            </b>

            <p className="text-sm text-stone-500">
              {isStaff ? (isManager ? "Panel Manajer" : "Panel Karyawan") : "Customer Portal"}
            </p>
          </div>

          <button
            type="button"
            className="ml-auto rounded-lg p-1 text-stone-500 hover:bg-stone-100 lg:hidden"
            onClick={onClose}
            aria-label="Tutup sidebar"
          >
            <X size={22} />
          </button>
        </div>

        <p className="px-7 pb-3 pt-7 text-xs font-bold uppercase tracking-widest text-stone-400">
          Menu utama
        </p>

        {/* List Navigasi Sidebar */}
        <nav className="space-y-1 px-3" aria-label="Navigasi utama">
          {links.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => handleNavigate(id)}
              aria-current={page === id ? "page" : undefined}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-semibold transition ${
                page === id
                  ? "bg-brand-600 text-white"
                  : "text-stone-600 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>

        {/* Panel Footer Information */}
        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-brand-50 p-4">
            <b className="text-brand-700">
              {isStaff ? "Panel DimsumKu" : "Belanja Dimsum"}
            </b>

            <p className="mt-2 text-sm leading-6 text-stone-600">
              {isStaff
                ? "Kelola menu, resep bahan baku, pesanan, dan stok dengan mudah."
                : "Pilih menu favorit, masukkan keranjang, dan checkout dengan mudah."}
            </p>
          </div>

          <p className="px-2 pt-4 text-xs text-stone-400">
            KEL9-DISMUS
          </p>
        </div>
      </aside>
    </>
  );
}
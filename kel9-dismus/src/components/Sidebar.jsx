import { useState } from "react";
import {
  Coffee,
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  BarChart3,
  X,
  Store,
  Home,
  Users,
  History,
  ShoppingCart,
  Utensils,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

// Navigasi internal staf (Manajer & Karyawan)
const staffLinks = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["menus", "Kelola Menu", Coffee],
  ["resep", "Resep Menu", Utensils],
  ["pesanan", "Pesanan", ShoppingBag],
  ["stok", "Stok Bahan Baku", Boxes],
  ["laporan", "Laporan", BarChart3],
  ["kelola_karyawan", "Kelola Karyawan", Users],
  ["profil", "Profil Saya", User],
];

// Navigasi Pelanggan
const customerLinks = [
  ["katalog", "Katalog", Home],
  ["dashboard", "Dashboard", LayoutDashboard],
  ["checkout", "Checkout", ShoppingCart],
  ["riwayat", "Riwayat Pembelian", History],
  ["profil", "Profil Saya", User],
];

export default function Sidebar({
  page,
  onNavigate,
  open,
  onClose,
  role = "pelanggan",
  collapsed: controlledCollapsed,
  onToggleCollapse,
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed =
    typeof controlledCollapsed === "boolean"
      ? controlledCollapsed
      : internalCollapsed;

  const isManager = role === "manajer" || role === "manager";
  const isStaff = isManager || role === "karyawan";

  const links = isStaff
    ? staffLinks.filter(([id]) => isManager || id !== "kelola_karyawan")
    : customerLinks;

  const handleToggleCollapse = () => {
    if (typeof onToggleCollapse === "function") {
      onToggleCollapse(!isCollapsed);
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

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
      {/* Backdrop Mobile */}
      {open && (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-stone-100 bg-white transition-all duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[260px] lg:w-[84px]" : "w-[260px]"}`}
      >
        {/* Header Brand + Tombol Buka/Tutup */}
        <div
          className={`flex shrink-0 items-center border-b border-stone-100 py-5 ${
            isCollapsed
              ? "justify-between px-5 lg:justify-center lg:px-3"
              : "justify-between gap-3 px-5"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0 rounded-2xl bg-brand-600 p-2.5 text-white shadow-xs">
              <Store size={24} />
            </div>

            <div className={isCollapsed ? "lg:hidden" : "block"}>
              <b className="block truncate text-lg leading-tight">
                Dimsum<span className="text-brand-600">Ku</span>
              </b>
              <p className="truncate text-xs text-stone-500">
                {isStaff
                  ? isManager
                    ? "Panel Manajer"
                    : "Panel Karyawan"
                  : "Customer Portal"}
              </p>
            </div>
          </div>

          {/* Tombol Tutup (Mobile) */}
          <button
            type="button"
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 lg:hidden"
            onClick={onClose}
            aria-label="Tutup sidebar"
          >
            <X size={20} />
          </button>

          {/* Tombol Buka/Tutup Sidebar (Desktop) */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={handleToggleCollapse}
              title="Kecilkan sidebar"
              aria-label="Kecilkan sidebar"
              className="hidden rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 lg:flex"
            >
              <PanelLeftClose size={19} />
            </button>
          )}
        </div>

        {/* Tombol Buka Kembali saat Sidebar Desktop Tertutup */}
        {isCollapsed && (
          <div className="hidden shrink-0 justify-center border-b border-stone-100 py-2.5 lg:flex">
            <button
              type="button"
              onClick={handleToggleCollapse}
              title="Perlebar sidebar"
              aria-label="Perlebar sidebar"
              className="rounded-xl p-2 text-stone-500 transition hover:bg-brand-50 hover:text-brand-700"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}

        {/* Area Scrollable (Menu + Footer Card) */}
        <div className="flex flex-1 flex-col justify-between overflow-y-auto overscroll-contain">
          <div>
            <p
              className={`px-7 pb-2.5 pt-5 text-xs font-bold uppercase tracking-widest text-stone-400 ${
                isCollapsed ? "lg:hidden" : "block"
              }`}
            >
              Menu utama
            </p>

            <nav
              className={`space-y-1 px-3 ${isCollapsed ? "lg:pt-4" : ""}`}
              aria-label="Navigasi utama"
            >
              {links.map(([id, label, Icon]) => {
                const active = page === id;
                return (
                  <button
                    key={id}
                    type="button"
                    title={isCollapsed ? label : undefined}
                    onClick={() => handleNavigate(id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-semibold transition ${
                      isCollapsed ? "lg:justify-center lg:px-0" : ""
                    } ${
                      active
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-stone-600 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span
                      className={`truncate ${isCollapsed ? "lg:hidden" : "block"}`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Card */}
          <div className="mt-6 p-4">
            <div
              className={`rounded-2xl bg-brand-50 p-4 ${
                isCollapsed ? "lg:hidden" : "block"
              }`}
            >
              <b className="text-sm text-brand-700">
                {isStaff ? "Panel DimsumKu" : "Belanja Dimsum"}
              </b>
              <p className="mt-1.5 text-xs leading-5 text-stone-600">
                {isStaff
                  ? "Kelola menu, resep bahan baku, pesanan, dan stok dengan mudah."
                  : "Pilih menu favorit, masukkan keranjang, dan checkout dengan mudah."}
              </p>
            </div>

            <p
              className={`px-2 pt-3 text-xs text-stone-400 ${
                isCollapsed ? "lg:px-0 lg:text-center lg:text-[10px]" : ""
              }`}
            >
              {isCollapsed ? "K9" : "KEL9-DISMUS"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
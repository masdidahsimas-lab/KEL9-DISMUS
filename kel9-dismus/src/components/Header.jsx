
import {
  Menu,
  RefreshCw,
  ShoppingBag,
  User,
  LogOut,
} from "lucide-react";

import { useCart } from "../context/CartContext";

export default function Header({
  title,
  onRefresh,
  onOpen,
  user,
  onLoginClick,
  onLogout,
  role = "pelanggan",
}) {
  const { totalItems = 0, setCartOpen } = useCart();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Pengguna";

  const isCustomer = role === "pelanggan";

  const handleLogoutClick = () => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin keluar dari akun ini?"
    );

    if (confirmed && typeof onLogout === "function") {
      onLogout();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-7">

      {/* Kiri: Tombol Hamburger dan Judul */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          aria-label="Buka Menu Sidebar"
          className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base font-extrabold leading-tight text-stone-800 sm:text-lg">
            {title || "Dashboard"}
          </h1>

          <p className="hidden text-[11px] font-medium text-stone-400 sm:block">
            {isCustomer
              ? "Sistem Pemesanan DimsumKu"
              : "Panel Operasional DimsumKu"}
          </p>
        </div>
      </div>

      {/* Kanan: Keranjang, Refresh, dan Auth */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Keranjang Belanja */}
        {isCustomer && (
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Buka keranjang, ${totalItems} barang`}
            className="relative flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50"
          >
            <ShoppingBag className="text-amber-600" size={18} />

            <span className="hidden sm:inline">
              Keranjang
            </span>

            {totalItems > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        )}

        {/* Refresh Data */}
        <button
          type="button"
          onClick={() => {
            if (typeof onRefresh === "function") {
              onRefresh();
            }
          }}
          title="Refresh Data"
          aria-label="Refresh Data"
          className="rounded-xl border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
        >
          <RefreshCw size={18} />
        </button>

        {/* Status Login dan Logout */}
        {user ? (
          <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold text-stone-800">
                {displayName}
              </p>

              <p className="text-[10px] capitalize text-stone-400">
                {role}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogoutClick}
              aria-label="Keluar dari akun"
              className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
            >
              <LogOut size={16} />

              <span className="hidden sm:inline">
                Keluar
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow transition hover:bg-amber-700"
          >
            <User size={16} />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
}

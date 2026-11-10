import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, AlertCircle, CheckCircle2, X } from "lucide-react";
import Swal from "sweetalert2";
import { AuthProvider } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import CartDrawer from "./components/CartDrawer";

// Import Halaman Manajer & Karyawan
import Dashboard from "./pages/Dashboard";
import MenuPage from "./pages/MenuPage";
import MenuManagement from "./pages/manajer/MenuManagement";
import AddEmployee from "./pages/manajer/AddEmployee";
import ManagerReports from "./pages/manajer/ManagerReports";
import OrdersPage from "./pages/OrdersPage";
import StockPage from "./pages/StockPage";

// Import Halaman Pelanggan
import DashboardCust from "./pages/pelanggan/DashboardCust";
import Checkout from "./pages/pelanggan/Checkout";
import CustomerHistory from "./pages/pelanggan/CustomerHistory";
import CustomerCatalog from "./pages/pelanggan/CustomerCatalog";

import { CartProvider, useCart } from "./context/CartContext";
import { getMenus } from "./services/menuService";
import { getOrders, updateOrderStatus } from "./services/orderService";
import { getStock, saveStock as saveStockService, deleteStock as deleteStockService } from "./services/stockService";
import { getCurrentUser, logoutUser } from "./services/authService";

const labels = {
  katalog: "Katalog Dimsum",
  dashboard: "Dashboard Utama",
  menus: "Kelola Menu",
  resep: "Resep Menu & Stok Porsi",
  pesanan: "Pesanan",
  stok: "Stok Bahan Baku",
  laporan: "Laporan Penjualan",
  checkout: "Checkout & Pembayaran",
  riwayat: "Riwayat Pembelian",
  tambah_karyawan: "Tambah Pegawai",
};

const getUserRole = (user) => {
  const roleFromMeta =
    user?.user_metadata?.role ||
    user?.user_metadata?.akses ||
    user?.app_metadata?.role ||
    user?.app_metadata?.akses ||
    "pelanggan";

  const validRoles = ["pelanggan", "karyawan", "manajer", "manager"];
  const savedRole = localStorage.getItem("dimsum_user_role");

  if (validRoles.includes(roleFromMeta)) {
    return roleFromMeta;
  }

  if (validRoles.includes(savedRole)) {
    return savedRole;
  }

  return "pelanggan";
};

function MainApp() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("pelanggan");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [checkoutLoading] = useState(false);
  const { cart } = useCart();

  const applyUser = useCallback((nextUser) => {
    const nextRole = getUserRole(nextUser);
    setUser(nextUser);
    setRole(nextRole);

    if (nextUser) {
      localStorage.setItem("dimsum_user_role", nextRole);
    } else {
      localStorage.removeItem("dimsum_user_role");
    }
  }, []);

  // Perbaikan: Opsi showSpinner agar refresh latar belakang tidak me-unmount halaman
  const refresh = useCallback(async (showSpinner = false) => {
    if (!supabase) {
      setError("Konfigurasi Supabase belum ada.");
      setLoading(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
    }
    setError("");

    const [menusRes, ordersRes, stockRes, userRes] = await Promise.all([
      getMenus(),
      getOrders(),
      getStock(),
      getCurrentUser(),
    ]);

    const failed = [menusRes, ordersRes, stockRes].find((result) => result.error);

    if (failed) {
      setError(`Gagal mengambil data dari Supabase: ${failed.error.message}`);
    } else {
      setMenus(menusRes.data || []);
      setOrders(ordersRes.data || []);
      setStock(stockRes.data || []);
    }

    if (userRes.data) {
      applyUser(userRes.data);
    } else {
      applyUser(null);
      setRole("pelanggan");
    }

    setLoading(false);
  }, [applyUser]);

  useEffect(() => {
    refresh(true);

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        const nextUser = session?.user ?? null;
        applyUser(nextUser);
      });

      return () => authListener.subscription.unsubscribe();
    }
  }, [applyUser, refresh]);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(timeout);
  }, [message]);

  async function handleCheckoutProcess() {
    if (checkoutLoading) return;

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      setError("Keranjang belanja Anda masih kosong.");
      return;
    }

    setPage("checkout");
  }

  async function changeStatus(order, status) {
    const { error } = await updateOrderStatus(order.id, status);

    if (error) {
      setError(`Status pesanan gagal diubah: ${error.message}`);
      return;
    }

    setMessage("Status pesanan berhasil diperbarui.");
    refresh();
  }

  async function saveStock(data, id) {
    const { error } = await saveStockService(data, id);

    if (error) {
      setError(`Stok gagal disimpan: ${error.message}`);
      throw error;
    }

    setMessage("Data stok berhasil disimpan.");
    await refresh();
  }

  async function handleDeleteStock(id) {
    const { error } = await deleteStockService(id);

    if (error) {
      setError(`Stok gagal dihapus: ${error.message}`);
      return { error };
    }

    setStock((prevStock) => prevStock.filter((item) => item.id !== id));
    setMessage("Bahan baku berhasil dihapus.");
    return { error: null };
  }

  async function handleLogout() {
    const result = await Swal.fire({
      title: "Konfirmasi Keluar",
      text: "Apakah Anda yakin ingin keluar dari akun ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Keluar!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    const res = await logoutUser();

    if (res?.error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Keluar",
        text: res.error.message,
        confirmButtonColor: "#e11d48",
      });
      return;
    }

    applyUser(null);
    setPage("katalog");

    Swal.fire({
      icon: "success",
      title: "Berhasil Keluar",
      text: "Anda telah keluar dari akun.",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  const isManager = role === "manajer" || role === "manager";
  const isManagerOrStaff = isManager || role === "karyawan";

  // Perbaikan: Rute switch-case yang bersih tanpa duplikasi
  const renderManagerContent = () => {
    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            userRole={role}
            menus={menus}
            orders={orders}
            stock={stock}
            user={user}
            onNavigate={setPage}
          />
        );
      case "menus":
        return (
          <MenuPage
            menus={menus}
            onRefresh={refresh}
            onError={setError}
            onMessage={setMessage}
          />
        );
      case "resep":
        return <MenuManagement onRefresh={refresh} />;
      case "stok":
        return (
          <StockPage
            stock={stock}
            onSave={saveStock}
            onDelete={handleDeleteStock}
            onRefresh={refresh}
            onError={setError}
          />
        );
      case "laporan":
        return <ManagerReports orders={orders} />;
      case "tambah_karyawan":
        return isManager ? (
          <AddEmployee />
        ) : (
          <Dashboard
            userRole={role}
            menus={menus}
            orders={orders}
            stock={stock}
            user={user}
            onNavigate={setPage}
          />
        );
      default:
        return (
          <Dashboard
            userRole={role}
            menus={menus}
            orders={orders}
            stock={stock}
            user={user}
            onNavigate={setPage}
          />
        );
    }
  };

  const renderCustomerContent = () => {
    switch (page) {
      case "dashboard":
        return (
          <DashboardCust
            menus={menus}
            orders={orders}
            stock={stock}
            user={user}
            onNavigate={setPage}
          />
        );
      case "checkout":
        return (
          <Checkout
            onRefresh={refresh}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={setPage}
            onOrderSuccess={() => {
              setMessage("Pesanan berhasil dibuat!");
              refresh();
              setPage("riwayat");
            }}
          />
        );
      case "riwayat":
        return <CustomerHistory onNavigate={setPage} />;
      case "katalog":
      default:
        return (
          <CustomerCatalog
            menus={menus}
            onCheckout={handleCheckoutProcess}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f7]">
      <Sidebar
        page={page}
        onNavigate={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />

      <div className="min-h-screen lg:pl-[260px]">
        <Header
          title={labels[page] || "Dashboard"}
          onRefresh={() => refresh(true)}
          onOpen={() => setSidebarOpen(true)}
          user={user}
          role={role}
          onLoginClick={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800"
            >
              <AlertCircle className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm leading-6">{error}</p>
              <button onClick={() => setError("")} aria-label="Tutup pesan">
                <X size={18} />
              </button>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800"
            >
              <CheckCircle2 size={20} />
              {message}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-4 text-stone-500">
              <LoaderCircle className="animate-spin text-amber-600" size={35} />
              <p>Memuat data Supabase...</p>
            </div>
          ) : isManagerOrStaff ? (
            renderManagerContent()
          ) : (
            renderCustomerContent()
          )}
        </main>
      </div>

      <CartDrawer onCheckout={handleCheckoutProcess} />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => {
          const nextRole = getUserRole(u);
          applyUser(u);
          setMessage("Berhasil masuk! Selamat datang.");
          setAuthModalOpen(false);

          if (nextRole === "pelanggan") {
            setPage("katalog");
          } else {
            setPage("dashboard");
          }
        }}
        onError={setError}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
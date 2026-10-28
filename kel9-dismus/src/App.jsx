import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, AlertCircle, CheckCircle2, X } from "lucide-react";

import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import CartDrawer from "./components/CartDrawer";

import Dashboard from "./pages/Dashboard";
import CustomerDashboard from "./pages/pelanggan/Dashboard";
import MenuPage from "./pages/MenuPage";
import OrdersPage from "./pages/OrdersPage";
import StockPage from "./pages/StockPage";
import ReportsPage from "./pages/ReportsPage";
import CustomerCatalog from "./pages/pelanggan/CustomerCatalog";

import { CartProvider, useCart } from "./context/CartContext";
import { getMenus } from "./services/menuService";
import { getOrders, updateOrderStatus, createOrder } from "./services/orderService";
import { getStock, saveStock as saveStockService } from "./services/stockService";
import { getCurrentUser, logoutUser } from "./services/authService";

const labels = {
  katalog: "Katalog Dimsum",
  dashboard: "Dashboard",
  menus: "Kelola Menu",
  pesanan: "Pesanan",
  stok: "Stok Bahan",
  laporan: "Laporan",
};

const getUserRole = (user) => {
  const roleFromMeta =
    user?.user_metadata?.role ||
    user?.user_metadata?.akses ||
    user?.app_metadata?.role ||
    user?.app_metadata?.akses ||
    "pelanggan";

  const validRoles = ["pelanggan", "karyawan", "manager"];
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

  const { cart, totalPrice, clearCart } = useCart();

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

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError("Konfigurasi Supabase belum ada. Salin .env.example menjadi .env lalu isi URL dan publishable/anon key.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [menusRes, ordersRes, stockRes, userRes] = await Promise.all([
      getMenus(),
      getOrders(),
      getStock(),
      getCurrentUser(),
    ]);

    const failed = [menusRes, ordersRes, stockRes].find((result) => result.error);

    if (failed) {
      setError(`Gagal mengambil data dari Supabase: ${failed.error.message}. Periksa nama kolom/tabel dan kebijakan RLS.`);
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
    refresh();

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
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      setError("Keranjang belanja Anda masih kosong.");
      return;
    }

    const orderPayload = {
      user_id: user.id,
      total_amount: totalPrice,
      items: cart,
      status: "Pending",
    };

    const { error } = await createOrder(orderPayload);

    if (error) {
      setError(`Gagal membuat pesanan: ${error.message}`);
      return;
    }

    clearCart();
    setMessage("Pesanan berhasil dibuat! Silakan cek di menu Pesanan.");
    refresh();
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

  async function handleLogout() {
    const result = await logoutUser();

    if (result.error) {
      setError(`Gagal logout: ${result.error.message}`);
      return;
    }

    applyUser(null);
    setPage("katalog");
    setMessage("Berhasil keluar.");
  }

  const isManagerOrStaff = role === "manager" || role === "karyawan";

  useEffect(() => {
    if (!user) {
      setRole("pelanggan");
      return;
    }

    const nextRole = getUserRole(user);
    setRole(nextRole);

    if (nextRole === "pelanggan") {
      setPage("katalog");
    } else {
      setPage("dashboard");
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#faf8f7]">
      <Sidebar page={page} onNavigate={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />

      <div className="min-h-screen lg:pl-[260px]">
        <Header
          title={labels[page] || "Dashboard"}
          onRefresh={refresh}
          onOpen={() => setSidebarOpen(true)}
          user={user}
          role={role}
          onLoginClick={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-9">
          {error && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <AlertCircle className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm leading-6">{error}</p>
              <button onClick={() => setError("")} aria-label="Tutup pesan">
                <X size={18} />
              </button>
            </div>
          )}

          {message && (
            <div role="status" className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">
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
            page === "dashboard" ? (
              <Dashboard menus={menus} orders={orders} stock={stock} user={user} onNavigate={setPage} />
            ) : page === "menus" ? (
              <MenuPage menus={menus} onRefresh={refresh} onError={setError} onMessage={setMessage} />
            ) : page === "pesanan" ? (
              <OrdersPage orders={orders} onStatus={changeStatus} onError={setError} />
            ) : page === "stok" ? (
              <StockPage stock={stock} onSave={saveStock} onError={setError} />
            ) : (
              <ReportsPage orders={orders} />
            )
          ) : (
            page === "dashboard" ? (
              <CustomerDashboard menus={menus} orders={orders} stock={stock} user={user} onNavigate={setPage} />
            ) : (
              <CustomerCatalog menus={menus} onCheckout={handleCheckoutProcess} />
            )
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
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}
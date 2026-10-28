import { useState, useMemo } from "react";
import { Search, Plus, Check, ShoppingBag, UtensilsCrossed, AlertCircle } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CustomerCatalog({ menus = [], onCheckout }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [addedId, setAddedId] = useState(null);

  const { addToCart, totalItems, totalPrice, setCartOpen } = useCart();

  // 1. Ambil kategori unik secara dinamis langsung dari data database
  const categories = useMemo(() => {
    const list = menus
      .map((item) => item.kategori)
      .filter((kategori) => Boolean(kategori));
    return ["Semua", ...Array.from(new Set(list))];
  }, [menus]);

  // 2. Filter menu berdasarkan pencarian & kategori dari DB
  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchCategory =
        selectedCategory === "Semua" || item.kategori === selectedCategory;
      const matchSearch = item.nama_menu
        ?.toLowerCase()
        .includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menus, selectedCategory, search]);

  // 3. Fungsi tambah ke keranjang dengan pemetaan kolom DB Supabase
  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.nama_menu, // Mensejajarkan dengan kolom 'nama_menu' DB
      price: item.harga,    // Mensejajarkan dengan kolom 'harga' DB
      kategori: item.kategori,
    });

    // Feedback animasi tombol
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="space-y-6">
      {/* Banner Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            🥟 Dismus Fresh & Delicious
          </span>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-4xl">
            Nikmati Dimsum Hangat Pilihanmu
          </h1>
          <p className="mt-2 text-xs text-amber-100 sm:text-sm">
            Pilih varian dimsum favorit langsung dari dapur kami. Tambahkan ke keranjang dan lakukan pemesanan dengan mudah.
          </p>
        </div>
        <div className="absolute -bottom-6 -right-6 text-8xl opacity-20 pointer-events-none sm:text-9xl">
          🥟
        </div>
      </div>

      {/* Bar Pencarian & Filter Kategori Dinamis */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Kategori Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-amber-600 text-white shadow-md"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Input Pencarian */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Cari menu dimsum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Grid Katalog Menu dari Database */}
      {filteredMenus.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white p-8 text-center">
          <UtensilsCrossed className="mb-3 text-stone-300" size={48} />
          <p className="text-sm font-semibold text-stone-600">
            {menus.length === 0
              ? "Belum ada menu di database Supabase."
              : "Menu tidak ditemukan."}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Coba ganti kata kunci atau pilih kategori lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMenus.map((item) => {
            const isAvailable = item.tersedia !== false;

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div>
                  {/* Thumbnail / Header Card */}
                  <div className="relative mb-3 flex h-36 w-full items-center justify-center rounded-xl bg-amber-50/60 text-5xl">
                    <span>🥟</span>
                    
                    {/* Badge Kategori */}
                    {item.kategori && (
                      <span className="absolute left-2 top-2 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-bold text-amber-800 backdrop-blur-sm">
                        {item.kategori}
                      </span>
                    )}

                    {/* Badge Status Stok */}
                    {!isAvailable && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        <AlertCircle size={12} /> Stok Habis
                      </span>
                    )}
                  </div>

                  {/* Info Menu */}
                  <h3 className="font-bold text-stone-800 group-hover:text-amber-600 transition">
                    {item.nama_menu}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                    {item.deskripsi || "Tidak ada deskripsi."}
                  </p>
                </div>

                {/* Footer Card: Harga & Tombol Beli */}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div>
                    <span className="block text-[10px] text-stone-400">Harga</span>
                    <span className="font-extrabold text-amber-600 text-sm">
                      Rp {Number(item.harga || 0).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!isAvailable}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      !isAvailable
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                        : addedId === item.id
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 text-white hover:bg-amber-700 active:scale-95"
                    }`}
                  >
                    {addedId === item.id ? (
                      <>
                        <Check size={14} /> Masuk
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Tambah
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Bar Keranjang (Mobile/Quick Access) */}
      {totalItems > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-stone-900 p-4 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
              <ShoppingBag size={20} />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold">
                {totalItems}
              </span>
            </div>
            <div>
              <p className="text-[11px] text-stone-400">Total Belanja</p>
              <p className="text-sm font-bold text-amber-400">
                Rp {totalPrice.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-600"
          >
            Lihat Keranjang →
          </button>
        </div>
      )}
    </div>
  );
}
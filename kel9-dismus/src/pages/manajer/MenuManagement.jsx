import React, { useState, useEffect } from "react";
import { Boxes, Utensils, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";
import { getMenusWithPortions, clearMenuRecipe } from "../../services/recipeService";
import { supabase } from "../../lib/supabase";
import { rupiah } from "../../utils/format";
import RecipeModal from "../../components/RecipeModal";

export default function MenuManagement({ onRefresh }) {
  const [menus, setMenus] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const menuData = await getMenusWithPortions();
      setMenus(menuData);

      const { data: stockData } = await supabase
        .from("stok_bahan_baku")
        .select("*")
        .order("nama_bahan", { ascending: true });
      setRawMaterials(stockData || []);

      // Trigger refresh data stok ke App.jsx agar StockPage ikut ter-update secara global
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Gagal memuat data menu & stok:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRecipeModal = (menu) => {
    setSelectedMenu(menu);
    setIsRecipeModalOpen(true);
  };

  const handleClearCard = async (menu) => {
    const confirm = await Swal.fire({
      title: "Kosongkan Resep?",
      text: `Hapus seluruh pemetaan bahan baku untuk "${menu.nama_menu}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      await clearMenuRecipe(menu.id);
      Swal.fire({
        icon: "success",
        title: "Dikosongkan!",
        text: `Resep ${menu.nama_menu} telah di-reset.`,
        timer: 1500,
        showConfirmButton: false,
      });
      await fetchData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengosongkan",
        text: err.message || "Terjadi kesalahan.",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Resep Menu & Stok Porsi</h1>
          <p className="text-xs text-stone-500">
            Stok porsi dihitung otomatis berdasarkan ketersediaan bahan baku paling minim di gudang.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu) => {
          const resepItems = menu.menu_bahan_baku || [];
          const pcsAdonan = menu.pcs_per_adonan;
          const pcsPorsi = menu.pcs_per_porsi;

          return (
            <div
              key={menu.id}
              className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-stone-800 text-base">
                    {menu.nama_menu}
                  </h3>
                  <span className="font-black text-amber-600 text-sm">
                    {rupiah(menu.harga)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  {menu.has_recipe ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        menu.estimasi_porsi > 5
                          ? "bg-emerald-100 text-emerald-800"
                          : menu.estimasi_porsi > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      <Boxes size={14} />
                      <span>
                        {menu.estimasi_porsi > 0
                          ? `Tersedia ${menu.estimasi_porsi} Porsi`
                          : "Stok Bahan Habis (0 Porsi)"}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-500">
                      Belum Konfigurasi Porsi / Resep
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-stone-50 p-3.5 border border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                      {pcsAdonan ? `Bahan 1 Adonan (${pcsAdonan} pcs):` : "Resep Bahan Baku:"}
                    </span>
                    {pcsPorsi && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                        1 Porsi = {pcsPorsi} pcs
                      </span>
                    )}
                  </div>

                  {resepItems.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">
                      Belum ada bahan baku yang dihubungkan.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {resepItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-xs text-stone-600 font-medium"
                        >
                          <span className="truncate">
                            • {item.stok_bahan_baku?.nama_bahan || `Bahan #${item.bahan_id}`}
                          </span>
                          <span className="font-bold text-stone-800 shrink-0 ml-2">
                            {item.jumlah_dibutuhkan} {item.stok_bahan_baku?.satuan || ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-stone-100 pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openRecipeModal(menu)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-stone-100 py-2.5 text-xs font-bold text-stone-700 hover:bg-amber-50 hover:text-amber-700 transition"
                >
                  <Utensils size={14} />
                  <span>Atur Resep & Porsi</span>
                </button>

                {menu.has_recipe && (
                  <button
                    type="button"
                    onClick={() => handleClearCard(menu)}
                    title="Kosongkan Resep"
                    className="flex items-center justify-center rounded-2xl bg-rose-50 p-2.5 text-rose-600 hover:bg-rose-100 transition"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RecipeModal
        menu={selectedMenu}
        rawMaterials={rawMaterials}
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        onRefresh={fetchData}
      />
    </div>
  );
}
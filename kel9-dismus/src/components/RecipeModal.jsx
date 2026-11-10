import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, LoaderCircle, Boxes, Calculator, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";
import { saveMenuRecipe, clearMenuRecipe } from "../services/recipeService";

export default function RecipeModal({
  menu,
  rawMaterials = [],
  isOpen,
  onClose,
  onRefresh,
}) {
  const [recipe, setRecipe] = useState([]);
  const [pcsPerAdonan, setPcsPerAdonan] = useState("");
  const [pcsPerPorsi, setPcsPerPorsi] = useState("");
  const [potongStok, setPotongStok] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (menu) {
      setPcsPerAdonan(menu.pcs_per_adonan ?? "");
      setPcsPerPorsi(menu.pcs_per_porsi ?? "");

      if (menu.menu_bahan_baku) {
        setRecipe(
          menu.menu_bahan_baku.map((r) => ({
            bahan_id: r.bahan_id,
            jumlah_dibutuhkan: r.jumlah_dibutuhkan,
          }))
        );
      } else {
        setRecipe([]);
      }
    }
  }, [menu]);

  if (!isOpen || !menu) return null;

  const handleAddRow = () => {
    const availableMaterial = rawMaterials.find(
      (m) => !recipe.some((r) => Number(r.bahan_id) === Number(m.id))
    );

    if (!availableMaterial) {
      Swal.fire({
        icon: "warning",
        title: "Bahan Habis",
        text: "Semua bahan baku dari stok sudah dimasukkan ke dalam resep menu ini.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    setRecipe([
      ...recipe,
      { bahan_id: availableMaterial.id, jumlah_dibutuhkan: 1 },
    ]);
  };

  const handleRemoveRow = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...recipe];
    updated[index][field] = value;
    setRecipe(updated);
  };

  // Fungsi Clear / Kosongkan Bahan Baku
  const handleClearRecipe = async () => {
    const confirm = await Swal.fire({
      title: "Kosongkan Bahan Baku?",
      text: `Seluruh resep dan porsi untuk menu "${menu.nama_menu}" akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Kosongkan!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setClearing(true);
    try {
      await clearMenuRecipe(menu.id);
      setRecipe([]);
      setPcsPerAdonan("");
      setPcsPerPorsi("");

      Swal.fire({
        icon: "success",
        title: "Resep Dikosongkan",
        text: `Resep menu ${menu.nama_menu} telah di-reset.`,
        timer: 1500,
        showConfirmButton: false,
      });

      if (onRefresh) await onRefresh();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengosongkan",
        text: err.message || "Terjadi kesalahan.",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pcsPerAdonan || Number(pcsPerAdonan) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Input Belum Lengkap",
        text: "Masukkan jumlah pcs yang dihasilkan dalam 1 adonan.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    if (!pcsPerPorsi || Number(pcsPerPorsi) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Input Belum Lengkap",
        text: "Masukkan jumlah pcs yang dijual dalam 1 porsi.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    setSubmitting(true);

    try {
      await saveMenuRecipe(
        menu.id,
        recipe,
        {
          pcs_per_adonan: pcsPerAdonan,
          pcs_per_porsi: pcsPerPorsi,
        },
        potongStok
      );

      Swal.fire({
        icon: "success",
        title: "Resep Disimpan",
        text: potongStok
          ? `Bahan baku terpotong dari stok gudang & porsi ${menu.nama_menu} diperbarui.`
          : `Pengaturan resep ${menu.nama_menu} berhasil diperbarui.`,
        timer: 2000,
        showConfirmButton: false,
      });

      if (onRefresh) await onRefresh();
      onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan Resep",
        text: err.message || "Terjadi kesalahan sistem.",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const estimasiPorsiPerAdonan =
    Number(pcsPerPorsi) > 0 && Number(pcsPerAdonan) > 0
      ? (Number(pcsPerAdonan) / Number(pcsPerPorsi)).toFixed(1)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-lg font-black text-stone-800">
              Atur Resep & Konfigurasi Porsi
            </h3>
            <p className="text-xs text-amber-600 font-bold mt-0.5">
              Menu: {menu.nama_menu}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* SKALA ADONAN & PORSI */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between text-amber-800 font-extrabold text-xs">
              <span className="flex items-center gap-2">
                <Calculator size={16} />
                Input Skala Resep & Porsi
              </span>
              {(recipe.length > 0 || pcsPerAdonan) && (
                <button
                  type="button"
                  onClick={handleClearRecipe}
                  disabled={clearing}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 underline transition"
                >
                  <RotateCcw size={12} />
                  <span>Clear Resep</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">
                  Hasil 1 Adonan (pcs):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pcsPerAdonan}
                  onChange={(e) => setPcsPerAdonan(e.target.value)}
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-amber-500"
                  placeholder="Contoh: 35"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">
                  Isi 1 Porsi (pcs):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pcsPerPorsi}
                  onChange={(e) => setPcsPerPorsi(e.target.value)}
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-amber-500"
                  placeholder="Contoh: 3"
                />
              </div>
            </div>

            {pcsPerAdonan && pcsPerPorsi && (
              <p className="text-[11px] text-amber-700 font-medium">
                💡 1 Adonan ({pcsPerAdonan} pcs) = <strong>{estimasiPorsiPerAdonan} Porsi</strong>
              </p>
            )}
          </div>

          {/* CHECKBOX POTONG STOK FISIK */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="potongStok"
              checked={potongStok}
              onChange={(e) => setPotongStok(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="potongStok" className="text-xs font-bold text-stone-700 cursor-pointer">
              Potong stok bahan baku di gudang otomatis saat disimpan
            </label>
          </div>

          <p className="text-xs text-stone-500">
            {pcsPerAdonan
              ? `Takaran bahan baku untuk 1 Adonan (${pcsPerAdonan} pcs):`
              : "Takaran bahan baku untuk 1 Adonan:"}
          </p>

          {/* DAFTAR BAHAN BAKU */}
          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
            {recipe.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-2xl">
                <Boxes className="mx-auto mb-2 opacity-40 text-amber-600" size={28} />
                Belum ada bahan baku yang dihubungkan.
              </div>
            ) : (
              recipe.map((item, index) => {
                const selectedMaterial = rawMaterials.find(
                  (m) => Number(m.id) === Number(item.bahan_id)
                );

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-2xl border border-stone-200 p-3 bg-stone-50/50"
                  >
                    <div className="flex-1">
                      <select
                        value={item.bahan_id}
                        onChange={(e) =>
                          handleItemChange(index, "bahan_id", e.target.value)
                        }
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 outline-none focus:border-amber-500"
                      >
                        {rawMaterials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nama_bahan} (Stok: {m.jumlah_stok} {m.satuan})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28 flex items-center gap-1">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={item.jumlah_dibutuhkan}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "jumlah_dibutuhkan",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800 text-center outline-none focus:border-amber-500"
                        placeholder="Butuh"
                      />
                      <span className="text-[10px] font-semibold text-stone-500">
                        {selectedMaterial?.satuan || "pcs"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-500/60 bg-amber-50/50 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100/60 transition"
          >
            <Plus size={16} />
            <span>Tambah Bahan Baku</span>
          </button>

          {/* ACTIONS */}
          <div className="flex items-center justify-between border-t pt-4">
            <button
              type="button"
              onClick={handleClearRecipe}
              disabled={clearing || recipe.length === 0}
              className="flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition"
            >
              <RotateCcw size={14} />
              <span>Clear Resep</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                <span>Simpan Resep</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
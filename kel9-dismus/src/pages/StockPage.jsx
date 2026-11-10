import { useEffect, useState } from "react";
import { Boxes, Plus, Edit3, Trash2, LoaderCircle } from "lucide-react";
import Swal from "sweetalert2";

import Modal, { Button, Field, inputClass } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { validateInput, VALID_STOCK_UNITS } from "../utils/validation";
import { deleteStock } from "../services/stockService";

const isLowStock = (jumlah, satuan) => {
  const s = (satuan || "").toLowerCase();
  if (s === "gram" || s === "g") return jumlah <= 500;
  if (s === "ml") return jumlah <= 500;
  if (s === "kg" || s === "liter") return jumlah <= 2;
  return jumlah <= 5;
};

export default function StockPage({ stock, onSave, onDelete, onRefresh, onError }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({
    nama_bahan: "",
    jumlah_stok: "",
    satuan: "gram",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Auto Refresh data stok saat halaman StockPage dibuka
  useEffect(() => {
    onRefresh?.();
  }, []);

  function open(item = null) {
    setEdit(item);
    setFieldErrors({});

    setForm(
      item
        ? {
            nama_bahan: item.nama_bahan || "",
            jumlah_stok: String(item.jumlah_stok ?? ""),
            satuan: item.satuan || "gram",
          }
        : {
            nama_bahan: "",
            jumlah_stok: "",
            satuan: "gram",
          }
    );

    onError?.("");
    setModal(true);
  }

  async function submit(e) {
    e.preventDefault();

    if (saving) return;

    const errors = {};

    const namaBahanError = validateInput({
      field: "Nama bahan",
      value: form.nama_bahan,
      required: true,
      type: "string",
      minLength: 2,
      format: /^[A-Za-z0-9À-ÖØ-öø-ÿ\s.'-]+$/,
    });
    if (namaBahanError) errors.nama_bahan = namaBahanError;

    const jumlahError = validateInput({
      field: "Jumlah stok",
      value: form.jumlah_stok,
      required: true,
      type: "number",
      min: 0,
    });
    if (jumlahError) errors.jumlah_stok = jumlahError;

    const satuanError = validateInput({
      field: "Satuan",
      value: form.satuan,
      required: true,
      domain: VALID_STOCK_UNITS,
    });
    if (satuanError) errors.satuan = satuanError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);

      Swal.fire({
        icon: "error",
        title: "Input Tidak Valid",
        text: Object.values(errors)[0],
        confirmButtonColor: "#e11d48",
      });
      return;
    }

    setSaving(true);
    setFieldErrors({});
    onError?.("");

    try {
      await onSave(
        {
          nama_bahan: form.nama_bahan.trim(),
          jumlah_stok: Number(form.jumlah_stok),
          satuan: form.satuan.trim() || "unit",
          updated_at: new Date().toISOString(),
        },
        edit?.id
      );

      setModal(false);
      setEdit(null);

      await onRefresh?.();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: edit
          ? "Stok berhasil diperbarui."
          : "Bahan baku berhasil ditambahkan.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMsg = err.message || "Gagal menyimpan stok.";
      onError?.(errorMsg);

      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: errorMsg,
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    const confirmResult = await Swal.fire({
      title: "Hapus Bahan Baku?",
      text: `Apakah Anda yakin ingin menghapus "${item.nama_bahan}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setDeleting(item.id);
      onError?.("");

      const res = onDelete
        ? await onDelete(item.id)
        : await deleteStock(item.id);

      if (res?.error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Hapus",
          text: res.error.message || res.error,
          confirmButtonColor: "#e11d48",
        });
        return;
      }

      await onRefresh?.();

      Swal.fire({
        icon: "success",
        title: "Terhapus!",
        text: "Bahan baku berhasil dihapus.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: err.message || err,
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setDeleting(null);
    }
  }

  const getInputStyle = (fieldName) =>
    `${inputClass} ${
      fieldErrors[fieldName]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : ""
    }`;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Stok Bahan Baku</h2>
          <p className="mt-2 text-stone-500">
            Periksa persediaan dan perbarui jumlah bahan.
          </p>
        </div>

        <Button onClick={() => open()}>
          <Plus size={18} /> Tambah Bahan
        </Button>
      </div>

      {stock.length === 0 ? (
        <EmptyState
          title="Belum ada bahan baku"
          description="Gunakan Tambah Bahan untuk memasukkan stok."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stock.map((s) => {
            const jumlah = Number(s.jumlah_stok || 0);
            const low = isLowStock(jumlah, s.satuan);

            return (
              <article
                key={s.id}
                className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft"
              >
                <div className="flex justify-between">
                  <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                    <Boxes />
                  </div>

                  <span
                    className={`h-fit rounded-full px-3 py-1.5 text-sm font-bold ${
                      jumlah <= 0
                        ? "bg-rose-50 text-rose-700"
                        : low
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {jumlah <= 0 ? "Habis" : low ? "Perlu dicek" : "Tersedia"}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-extrabold">
                  {s.nama_bahan}
                </h3>

                <p className="mt-3 text-sm text-stone-500">Jumlah stok</p>

                <p className="mb-5 mt-1 text-3xl font-extrabold">
                  {jumlah.toLocaleString("id-ID")}{" "}
                  <span className="text-base text-stone-500">
                    {s.satuan || "unit"}
                  </span>
                </p>

                <div className="mt-5 flex gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => open(s)}
                  >
                    <Edit3 size={16} /> Edit
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    disabled={deleting === s.id}
                    onClick={() => remove(s)}
                  >
                    {deleting === s.id ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Hapus
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          title={edit ? "Perbarui Stok" : "Tambah Bahan Baku"}
          onClose={() => !saving && setModal(false)}
        >
          <form className="space-y-4" onSubmit={submit} noValidate>
            <Field label="Nama bahan">
              <input
                className={getInputStyle("nama_bahan")}
                type="text"
                value={form.nama_bahan}
                onChange={(e) => {
                  setForm({
                    ...form,
                    nama_bahan: e.target.value,
                  });
                  if (fieldErrors.nama_bahan)
                    setFieldErrors({ ...fieldErrors, nama_bahan: null });
                }}
              />
              {fieldErrors.nama_bahan && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {fieldErrors.nama_bahan}
                </p>
              )}
            </Field>

            <Field label="Jumlah stok">
              <input
                className={getInputStyle("jumlah_stok")}
                type="number"
                min="0"
                step="any"
                value={form.jumlah_stok}
                onChange={(e) => {
                  setForm({
                    ...form,
                    jumlah_stok: e.target.value,
                  });
                  if (fieldErrors.jumlah_stok)
                    setFieldErrors({ ...fieldErrors, jumlah_stok: null });
                }}
              />
              {fieldErrors.jumlah_stok && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {fieldErrors.jumlah_stok}
                </p>
              )}
            </Field>

            <Field label="Satuan">
              <select
                className={getInputStyle("satuan")}
                value={form.satuan}
                onChange={(e) => {
                  setForm({
                    ...form,
                    satuan: e.target.value,
                  });
                  if (fieldErrors.satuan)
                    setFieldErrors({ ...fieldErrors, satuan: null });
                }}
              >
                {["gram", "kg", "ml", "liter", "pcs", "pack", "unit"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
              {fieldErrors.satuan && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {fieldErrors.satuan}
                </p>
              )}
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModal(false)}
                disabled={saving}
              >
                Batal
              </Button>

              <Button type="submit" disabled={saving}>
                {saving && (
                  <LoaderCircle className="animate-spin" size={18} />
                )}
                {saving ? "Menyimpan..." : "Simpan Stok"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
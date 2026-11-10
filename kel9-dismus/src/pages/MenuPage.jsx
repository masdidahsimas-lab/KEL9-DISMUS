import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Coffee,
  LoaderCircle,
} from "lucide-react";
import Swal from "sweetalert2"; // Import SweetAlert2

import Modal, { Button, Field, inputClass } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { rupiah } from "../utils/format";
import { saveMenu, deleteMenu } from "../services/menuService";
import {
  validateInput,
  VALID_MENU_CATEGORIES,
} from "../utils/validation";

export default function MenuPage({
  menus = [],
  onRefresh,
  onError,
  onMessage,
}) {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({
    nama_menu: "",
    kategori: "dimsum",
    harga: "",
    deskripsi: "",
    tersedia: true,
  });

  // State untuk menyimpan pesan error per input field (Validasi Teks Input)
  const [fieldErrors, setFieldErrors] = useState({});

  // Mencari menu berdasarkan nama atau kategori
  const filtered = useMemo(
    () =>
      menus.filter((m) =>
        `${m.nama_menu} ${m.kategori || ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [menus, query]
  );

  // Membuka modal tambah atau edit menu
  function open(item = null) {
    setEdit(item);
    setFieldErrors({}); // Reset error saat modal dibuka

    setForm(
      item
        ? {
            nama_menu: item.nama_menu || "",
            kategori: item.kategori?.toLowerCase() || "dimsum",
            harga: String(item.harga ?? ""),
            deskripsi: item.deskripsi || "",
            tersedia: item.tersedia ?? true,
          }
        : {
            nama_menu: "",
            kategori: "dimsum",
            harga: "",
            deskripsi: "",
            tersedia: true,
          }
    );

    onError?.("");
    setModal(true);
  }

  // Menyimpan menu baru atau memperbarui menu
  async function submit(e) {
    e.preventDefault();

    if (saving) return;

    const errors = {};

    // 1. Validasi Nama Menu
    const namaMenuError = validateInput({
      field: "Nama menu",
      value: form.nama_menu,
      required: true,
      type: "string",
      minLength: 2,
      format: /^[A-Za-z0-9À-ÖØ-öø-ÿ\s.'-]+$/,
    });
    if (namaMenuError) errors.nama_menu = namaMenuError;

    // 2. Validasi Kategori
    const kategoriError = validateInput({
      field: "Kategori",
      value: form.kategori,
      required: true,
      domain: VALID_MENU_CATEGORIES,
    });
    if (kategoriError) errors.kategori = kategoriError;

    // 3. Validasi Harga
    const harga = Number(form.harga);
    const hargaError = validateInput({
      field: "Harga menu",
      value: form.harga,
      required: true,
      type: "number",
      min: 0,
      integer: true,
    });
    if (hargaError) errors.harga = hargaError;

    // 4. Validasi Deskripsi
    const deskripsiError = validateInput({
      field: "Deskripsi",
      value: form.deskripsi,
      type: "string",
      minLength: 0,
    });
    if (deskripsiError) errors.deskripsi = deskripsiError;

    // Jika ada error input
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);

      // SweetAlert Pop-up di ATAS Modal
      Swal.fire({
        icon: "error",
        title: "Input Tidak Valid",
        text: Object.values(errors)[0], // Menampilkan error pertama
        confirmButtonColor: "#e11d48",
      });
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const res = await saveMenu(
        {
          nama_menu: form.nama_menu.trim(),
          kategori: form.kategori.trim().toLowerCase() || "dimsum",
          harga: harga,
          deskripsi: form.deskripsi.trim(),
          tersedia: form.tersedia,
        },
        edit?.id
      );

      if (res?.error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text: res.error.message || res.error,
          confirmButtonColor: "#e11d48",
        });
        return;
      }

      setModal(false);

      // Alert Sukses SweetAlert
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: edit ? "Menu berhasil diperbarui." : "Menu berhasil ditambahkan.",
        timer: 2000,
        showConfirmButton: false,
      });

      await onRefresh?.();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: error.message || error,
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSaving(false);
    }
  }

  // Menghapus menu dengan Konfirmasi SweetAlert
  async function remove(item) {
    const confirmResult = await Swal.fire({
      title: "Hapus Menu?",
      text: `Apakah Anda yakin ingin menghapus "${item.nama_menu}"?`,
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

      const res = await deleteMenu(item.id);

      if (res?.error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Hapus",
          text: res.error.message || res.error,
          confirmButtonColor: "#e11d48",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Terhapus!",
        text: "Menu berhasil dihapus.",
        timer: 2000,
        showConfirmButton: false,
      });

      await onRefresh?.();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: error.message || error,
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setDeleting(null);
    }
  }

  // Helper untuk menambahkan border merah pada input yang error
  const getInputStyle = (fieldName) =>
    `${inputClass} ${
      fieldErrors[fieldName]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : ""
    }`;

  return (
    <section className="space-y-6">
      {/* Judul dan Tombol Tambah */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Kelola Menu</h2>
          <p className="mt-2 text-stone-500">
            Atur nama, kategori, harga, dan ketersediaan menu.
          </p>
        </div>

        <Button type="button" onClick={() => open()}>
          <Plus size={18} />
          Tambah Menu
        </Button>
      </div>

      {/* Kolom Pencarian */}
      <div className="flex items-center gap-3 rounded-2xl border bg-white px-4">
        <Search className="text-stone-400" />
        <input
          className="min-h-14 w-full outline-none"
          placeholder="Cari nama atau kategori menu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Daftar Menu */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Menu belum tersedia"
          description="Tambahkan menu baru atau ubah pencarian."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft"
            >
              <div className="flex justify-between">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                  <Coffee />
                </div>

                <span
                  className={`h-fit rounded-full px-3 py-1.5 text-sm font-bold ${
                    m.tersedia
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {m.tersedia ? "Tersedia" : "Tidak tersedia"}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-extrabold">{m.nama_menu}</h3>

              <p className="text-sm text-stone-500">
                {m.kategori || "Tanpa kategori"}
              </p>

              <p className="mt-3 min-h-10 text-sm leading-6 text-stone-600">
                {m.deskripsi || "Belum ada deskripsi."}
              </p>

              <p className="mt-4 text-xl font-extrabold text-brand-700">
                {rupiah(m.harga)}
              </p>

              {/* Tombol Edit dan Hapus */}
              <div className="mt-5 flex gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => open(m)}
                >
                  <Edit3 size={16} />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  disabled={deleting === m.id}
                  onClick={() => remove(m)}
                >
                  {deleting === m.id ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Hapus
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Tambah dan Edit Menu */}
      {modal && (
        <Modal
          title={edit ? "Edit Menu" : "Tambah Menu Baru"}
          onClose={() => !saving && setModal(false)}
        >
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Nama menu">
              <input
                className={getInputStyle("nama_menu")}
                type="text"
                value={form.nama_menu}
                onChange={(e) => {
                  setForm({ ...form, nama_menu: e.target.value });
                  if (fieldErrors.nama_menu)
                    setFieldErrors({ ...fieldErrors, nama_menu: null });
                }}
              />
              {fieldErrors.nama_menu && (
                <p className="mt-1 text-xs text-red-600 font-semibold">
                  {fieldErrors.nama_menu}
                </p>
              )}
            </Field>

            <Field label="Kategori">
              <select
                className={getInputStyle("kategori")}
                value={form.kategori}
                onChange={(e) => {
                  setForm({ ...form, kategori: e.target.value });
                  if (fieldErrors.kategori)
                    setFieldErrors({ ...fieldErrors, kategori: null });
                }}
              >
                <option value="dimsum">Dimsum</option>
                <option value="minuman">Minuman</option>
              </select>
              {fieldErrors.kategori && (
                <p className="mt-1 text-xs text-red-600 font-semibold">
                  {fieldErrors.kategori}
                </p>
              )}
            </Field>

            <Field label="Harga (rupiah)">
              <input
                className={getInputStyle("harga")}
                type="number"
                min="0"
                step="1"
                value={form.harga}
                onChange={(e) => {
                  setForm({ ...form, harga: e.target.value });
                  if (fieldErrors.harga)
                    setFieldErrors({ ...fieldErrors, harga: null });
                }}
              />
              {fieldErrors.harga && (
                <p className="mt-1 text-xs text-red-600 font-semibold">
                  {fieldErrors.harga}
                </p>
              )}
            </Field>

            <Field label="Deskripsi">
              <textarea
                className={getInputStyle("deskripsi")}
                rows="3"
                value={form.deskripsi}
                onChange={(e) => {
                  setForm({ ...form, deskripsi: e.target.value });
                  if (fieldErrors.deskripsi)
                    setFieldErrors({ ...fieldErrors, deskripsi: null });
                }}
              />
              {fieldErrors.deskripsi && (
                <p className="mt-1 text-xs text-red-600 font-semibold">
                  {fieldErrors.deskripsi}
                </p>
              )}
            </Field>

            <label className="flex min-h-12 items-center gap-3 rounded-xl bg-stone-50 p-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 accent-rose-600"
                checked={form.tersedia}
                onChange={(e) =>
                  setForm({ ...form, tersedia: e.target.checked })
                }
              />
              <span className="text-sm font-medium">Menu tersedia untuk dipesan</span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => setModal(false)}
              >
                Batal
              </Button>

              <Button type="submit" disabled={saving}>
                {saving && (
                  <LoaderCircle className="animate-spin" size={18} />
                )}
                {saving ? "Menyimpan..." : "Simpan Menu"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
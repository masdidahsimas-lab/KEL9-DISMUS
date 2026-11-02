
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Coffee,
  LoaderCircle,
} from "lucide-react";

import { Button, Field, inputClass } from "../components/Modal";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { rupiah } from "../utils/format";
import { saveMenu, deleteMenu } from "../services/menuService";

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

  const [form, setForm] = useState({
    nama_menu: "",
    kategori: "dimsum",
    harga: "",
    deskripsi: "",
    tersedia: true,
  });

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

    const harga = Number(form.harga);

    if (!form.nama_menu.trim()) {
      onError?.("Nama menu wajib diisi.");
      return;
    }

    if (form.harga === "" || !Number.isFinite(harga) || harga < 0) {
      onError?.("Harga menu harus berupa angka yang valid.");
      return;
    }

    setSaving(true);
    onError?.("");

    try {
      const { error } = await saveMenu(
        {
          nama_menu: form.nama_menu.trim(),
          kategori: form.kategori.trim().toLowerCase(),
          harga,
          deskripsi: form.deskripsi.trim(),
          tersedia: form.tersedia,
        },
        edit?.id
      );

      if (error) {
        onError?.(`Menu gagal disimpan: ${error.message}`);
        return;
      }

      setModal(false);

      onMessage?.(
        edit
          ? "Menu berhasil diperbarui."
          : "Menu berhasil ditambahkan."
      );

      await onRefresh?.();
    } catch (error) {
      onError?.(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  // Menghapus menu
  async function remove(item) {
    const confirmed = window.confirm(
      `Hapus menu "${item.nama_menu}"?`
    );

    if (!confirmed) return;

    try {
      const { error } = await deleteMenu(item.id);

      if (error) {
        onError?.(`Menu gagal dihapus: ${error.message}`);
        return;
      }

      onMessage?.("Menu berhasil dihapus.");

      await onRefresh?.();
    } catch (error) {
      onError?.(`Terjadi kesalahan: ${error.message}`);
    }
  }

  return (
    <section className="space-y-6">

      {/* Judul dan Tombol Tambah */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold">
            Kelola Menu
          </h2>

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
                  {m.tersedia
                    ? "Tersedia"
                    : "Tidak tersedia"}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-extrabold">
                {m.nama_menu}
              </h3>

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
                  onClick={() => remove(m)}
                >
                  <Trash2 size={16} />
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
          <form onSubmit={submit} className="space-y-4">

            <Field label="Nama menu">
              <input
                className={inputClass}
                type="text"
                required
                value={form.nama_menu}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nama_menu: e.target.value,
                  })
                }
              />
            </Field>

            
            <Field label="Kategori">
              <select
                className={inputClass}
                value={form.kategori}
                onChange={(e) =>
                  setForm({
                    ...form,
                    kategori: e.target.value,
                  })
                }
              >
                <option value="dimsum">Dimsum</option>
                <option value="minuman">Minuman</option>
              </select>
            </Field>

            <Field label="Harga (rupiah)">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                required
                value={form.harga}
                onChange={(e) =>
                  setForm({
                    ...form,
                    harga: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Deskripsi">
              <textarea
                className={inputClass}
                rows="3"
                value={form.deskripsi}
                onChange={(e) =>
                  setForm({
                    ...form,
                    deskripsi: e.target.value,
                  })
                }
              />
            </Field>

            {/* Status Ketersediaan */}
            <label className="flex min-h-12 items-center gap-3 rounded-xl bg-stone-50 p-3">
              <input
                type="checkbox"
                className="h-5 w-5 accent-rose-600"
                checked={form.tersedia}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tersedia: e.target.checked,
                  })
                }
              />

              Menu tersedia untuk dipesan
            </label>

            {/* Tombol Modal */}
            <div className="flex justify-end gap-3">
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
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                  />
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

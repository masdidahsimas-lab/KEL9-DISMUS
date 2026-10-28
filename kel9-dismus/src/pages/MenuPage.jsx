import { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, Coffee, LoaderCircle } from "lucide-react";
import { Button, Field, inputClass } from "../components/Modal";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { rupiah } from "../utils/format";

export default function MenuPage({ menus, onRefresh, onError, onMessage }) {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama_menu: "",
    kategori: "Dimsum",
    harga: "",
    deskripsi: "",
    tersedia: true,
  });

  const filtered = useMemo(
    () => menus.filter((m) => `${m.nama_menu} ${m.kategori || ""}`.toLowerCase().includes(query.toLowerCase())),
    [menus, query]
  );

  function open(item = null) {
    setEdit(item);
    setForm(
      item
        ? {
            nama_menu: item.nama_menu || "",
            kategori: item.kategori || "Dimsum",
            harga: String(item.harga ?? ""),
            deskripsi: item.deskripsi || "",
            tersedia: item.tersedia ?? true,
          }
        : {
            nama_menu: "",
            kategori: "Dimsum",
            harga: "",
            deskripsi: "",
            tersedia: true,
          }
    );
    onError("");
    setModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    const { saveMenu } = await import("../services/menuService");
    const result = await saveMenu(
      {
        nama_menu: form.nama_menu.trim(),
        kategori: form.kategori.trim() || "Lainnya",
        harga: Number(form.harga),
        deskripsi: form.deskripsi.trim(),
        tersedia: form.tersedia,
      },
      edit?.id
    );

    setSaving(false);

    if (result.error) {
      onError(`Menu gagal disimpan: ${result.error.message}`);
      return;
    }

    setModal(false);
    onMessage(edit ? "Menu berhasil diperbarui." : "Menu berhasil ditambahkan.");
    onRefresh();
  }

  async function remove(item) {
    if (!confirm(`Hapus menu "${item.nama_menu}"?`)) return;

    const { deleteMenu } = await import("../services/menuService");
    const { error } = await deleteMenu(item.id);

    if (error) {
      onError(`Menu gagal dihapus: ${error.message}`);
      return;
    }

    onMessage("Menu berhasil dihapus.");
    onRefresh();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Kelola Menu</h2>
          <p className="mt-2 text-stone-500">Atur nama, kategori, harga, dan ketersediaan menu.</p>
        </div>
        <Button onClick={() => open()}>
          <Plus size={18} /> Tambah Menu
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border bg-white px-4">
        <Search className="text-stone-400" />
        <input
          className="min-h-14 w-full outline-none"
          placeholder="Cari nama atau kategori menu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Menu belum tersedia" description="Tambahkan menu baru atau ubah pencarian." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <article key={m.id} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft">
              <div className="flex justify-between">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                  <Coffee />
                </div>
                <span
                  className={`h-fit rounded-full px-3 py-1.5 text-sm font-bold ${
                    m.tersedia ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {m.tersedia ? "Tersedia" : "Tidak tersedia"}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-extrabold">{m.nama_menu}</h3>
              <p className="text-sm text-stone-500">{m.kategori || "Tanpa kategori"}</p>
              <p className="mt-3 min-h-10 text-sm leading-6 text-stone-600">{m.deskripsi || "Belum ada deskripsi."}</p>
              <p className="mt-4 text-xl font-extrabold text-brand-700">{rupiah(m.harga)}</p>

              <div className="mt-5 flex gap-2 border-t pt-4">
                <Button variant="secondary" onClick={() => open(m)}>
                  <Edit3 size={16} /> Edit
                </Button>
                <Button variant="danger" onClick={() => remove(m)}>
                  <Trash2 size={16} /> Hapus
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={edit ? "Edit Menu" : "Tambah Menu Baru"} onClose={() => setModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nama menu">
              <input
                className={inputClass}
                required
                value={form.nama_menu}
                onChange={(e) => setForm({ ...form, nama_menu: e.target.value })}
              />
            </Field>

            <Field label="Kategori">
              <input
                className={inputClass}
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              />
            </Field>

            <Field label="Harga (rupiah)">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                required
                value={form.harga}
                onChange={(e) => setForm({ ...form, harga: e.target.value })}
              />
            </Field>

            <Field label="Deskripsi">
              <textarea
                className={inputClass}
                rows="3"
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              />
            </Field>

            <label className="flex min-h-12 items-center gap-3 rounded-xl bg-stone-50 p-3">
              <input
                type="checkbox"
                className="h-5 w-5 accent-rose-600"
                checked={form.tersedia}
                onChange={(e) => setForm({ ...form, tersedia: e.target.checked })}
              />
              Menu tersedia untuk dipesan
            </label>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <LoaderCircle className="animate-spin" size={18} />}
                Simpan Menu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
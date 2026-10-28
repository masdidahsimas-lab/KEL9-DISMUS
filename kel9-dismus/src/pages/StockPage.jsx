import { useState } from "react";
import { Boxes, Plus, Edit3, LoaderCircle } from "lucide-react";
import Modal, { Button, Field, inputClass } from "../components/Modal";
import EmptyState from "../components/EmptyState";

export default function StockPage({ stock, onSave, onError }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama_bahan: "",
    jumlah_stok: "",
    satuan: "gram",
  });

  function open(item = null) {
    setEdit(item);
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
    onError("");
    setModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    await onSave(
      {
        nama_bahan: form.nama_bahan.trim(),
        jumlah_stok: Number(form.jumlah_stok),
        satuan: form.satuan.trim() || "unit",
        updated_at: new Date().toISOString(),
      },
      edit?.id
    );

    setSaving(false);
    setModal(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Stok Bahan Baku</h2>
          <p className="mt-2 text-stone-500">Periksa persediaan dan perbarui jumlah bahan.</p>
        </div>
        <Button onClick={() => open()}>
          <Plus size={18} /> Tambah Bahan
        </Button>
      </div>

      {stock.length === 0 ? (
        <EmptyState title="Belum ada bahan baku" description="Gunakan Tambah Bahan untuk memasukkan stok." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stock.map((s) => (
            <article key={s.id} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-soft">
              <div className="flex justify-between">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                  <Boxes />
                </div>
                <span
                  className={`h-fit rounded-full px-3 py-1.5 text-sm font-bold ${
                    Number(s.jumlah_stok) <= 5 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {Number(s.jumlah_stok) <= 0 ? "Habis" : Number(s.jumlah_stok) <= 5 ? "Perlu dicek" : "Tersedia"}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-extrabold">{s.nama_bahan}</h3>
              <p className="mt-3 text-sm text-stone-500">Jumlah stok</p>
              <p className="mb-5 mt-1 text-3xl font-extrabold">
                {Number(s.jumlah_stok || 0).toLocaleString("id-ID")}{" "}
                <span className="text-base text-stone-500">{s.satuan || "unit"}</span>
              </p>

              <Button variant="secondary" onClick={() => open(s)}>
                <Edit3 size={16} /> Perbarui stok
              </Button>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={edit ? "Perbarui Stok" : "Tambah Bahan Baku"} onClose={() => setModal(false)}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              try {
                await submit(e);
              } catch (err) {
                onError(err.message);
              }
            }}
          >
            <Field label="Nama bahan">
              <input
                className={inputClass}
                required
                value={form.nama_bahan}
                onChange={(e) => setForm({ ...form, nama_bahan: e.target.value })}
              />
            </Field>

            <Field label="Jumlah stok">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                required
                value={form.jumlah_stok}
                onChange={(e) => setForm({ ...form, jumlah_stok: e.target.value })}
              />
            </Field>

            <Field label="Satuan">
              <select
                className={inputClass}
                value={form.satuan}
                onChange={(e) => setForm({ ...form, satuan: e.target.value })}
              >
                {["gram", "kg", "ml", "liter", "pcs", "pack", "unit"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <LoaderCircle className="animate-spin" size={18} />}
                Simpan Stok
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
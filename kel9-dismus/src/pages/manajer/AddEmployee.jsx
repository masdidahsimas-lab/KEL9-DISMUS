import React, { useState } from "react";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  ShieldCheck,
  LoaderCircle,
  ShieldAlert,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import { supabase } from "../../lib/supabase";
import { addUserByManager } from "../../services/authService";
import { validateInput, VALID_EMPLOYEE_ROLES } from "../../utils/validation";

export default function AddEmployee({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "karyawan",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setFormData({ fullName: "", email: "", password: "", role: "karyawan" });
    onClose?.();
  };

  // Sinkronkan nama & email ke tabel profiles/users di Supabase
  const syncProfileData = async (userId, email, fullName, role) => {
    if (!userId) return;

    const candidateTables = ["profiles", "users"];
    for (const table of candidateTables) {
      const { data: sampleRows, error } = await supabase
        .from(table)
        .select("*")
        .limit(1);

      if (!error) {
        const cols = sampleRows?.[0] ? Object.keys(sampleRows[0]) : [];
        const payload = { id: userId };

        if (cols.length === 0 || cols.includes("email")) payload.email = email;
        if (cols.length === 0 || cols.includes("role")) payload.role = role;
        if (cols.includes("full_name")) payload.full_name = fullName;
        if (cols.includes("nama")) payload.nama = fullName;
        if (cols.includes("nama_lengkap")) payload.nama_lengkap = fullName;
        if (cols.includes("name")) payload.name = fullName;

        await supabase.from(table).upsert(payload, { onConflict: "id" });
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullNameError = validateInput({
      field: "Nama lengkap",
      value: formData.fullName,
      required: true,
      type: "string",
      minLength: 2,
      format: /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/,
    });

    if (fullNameError) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: fullNameError,
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const emailError = validateInput({
      field: "Email karyawan",
      value: formData.email,
      required: true,
      type: "email",
    });

    if (emailError) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: emailError,
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const passwordError = validateInput({
      field: "Password",
      value: formData.password,
      required: true,
      type: "string",
      minLength: 6,
    });

    if (passwordError) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: passwordError,
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const roleError = validateInput({
      field: "Role",
      value: formData.role,
      required: true,
      domain: VALID_EMPLOYEE_ROLES,
    });

    if (roleError) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: roleError,
        confirmButtonColor: "#d97706",
      });
      return;
    }

    setLoading(true);

    const trimmedEmail = formData.email.trim();
    const trimmedName = formData.fullName.trim();
    const selectedRole = formData.role;

    const { data, error } = await addUserByManager(
      trimmedEmail,
      formData.password,
      trimmedName,
      selectedRole
    );

    if (error) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Gagal Menambah Akun",
        text: error.message || "Terjadi kesalahan saat memproses pendaftaran.",
        confirmButtonColor: "#e11d48",
      });
      return;
    }

    const createdUser = data?.user || data;
    await syncProfileData(createdUser?.id, trimmedEmail, trimmedName, selectedRole);

    setLoading(false);
    setFormData({ fullName: "", email: "", password: "", role: "karyawan" });
    onClose?.();
    onSuccess?.(data);

    Swal.fire({
      icon: "success",
      title: "Karyawan Berhasil Ditambahkan!",
      html: `
        <div style="font-size: 13px; color: #44403c;">
          Akun <strong style="color: #d97706;">${selectedRole}</strong> untuk 
          <strong>${trimmedName}</strong> (${trimmedEmail}) telah terdaftar di sistem.
        </div>
      `,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Selesai",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-stone-200/80 bg-white p-6 shadow-2xl sm:p-7">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-800 sm:text-xl">
                Tambah Karyawan / User Baru
              </h2>
              <p className="text-xs text-stone-500">
                Daftarkan staf atau manajer operasional baru ke DimsumKu.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            aria-label="Tutup modal"
            className="rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Input Nama Lengkap */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Input Email Karyawan */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Email Karyawan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="email"
                required
                placeholder="karyawan@dimsumku.com"
                className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Password Initial <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          {/* Input Select Role */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Pilih Role Akses <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <ShieldCheck
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <select
                required
                className="w-full rounded-2xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="karyawan">Karyawan (Staf Operasional)</option>
                <option value="manajer">Manajer (Akses Full / Admin)</option>
              </select>
            </div>
          </div>

          {/* Info Banner Keamanan Sesi */}
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-3 text-[11px] text-amber-800">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Terisolasi Aman:</strong> Menambahkan akun karyawan tidak
              akan mengubah atau mengeluarkan akun Manajer Anda yang sedang aktif.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="rounded-2xl border border-stone-200 px-5 py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin" size={16} />
                  Memproses...
                </>
              ) : (
                "Simpan Karyawan Baru"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
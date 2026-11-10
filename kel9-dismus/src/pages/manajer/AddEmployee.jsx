import React, { useState } from "react";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  ShieldCheck,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import Swal from "sweetalert2";

import { addUserByManager } from "../../services/authService";
import { validateInput, VALID_EMPLOYEE_ROLES } from "../../utils/validation";

export default function AddEmployee() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "karyawan", // Default role karyawan
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validasi Nama Lengkap
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

    // 2. Validasi Email
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

    // 3. Validasi Password
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

    // 4. Validasi Role
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

    // Memanggil API addUserByManager dari authService.js (Terisolasi)
    const { data, error } = await addUserByManager(
      formData.email,
      formData.password,
      formData.fullName,
      formData.role
    );

    setLoading(false);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menambah Akun",
        text: error.message || "Terjadi kesalahan saat memproses pendaftaran.",
        confirmButtonColor: "#e11d48",
      });
      return;
    }

    // SweetAlert2 Sukses
    Swal.fire({
      icon: "success",
      title: "Karyawan Berhasil Ditambahkan!",
      html: `
        <div style="font-size: 13px; color: #44403c;">
          Akun <strong style="color: #d97706;">${formData.role}</strong> untuk 
          <strong>${formData.fullName}</strong> (${formData.email}) telah terdaftar di sistem.
        </div>
      `,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Selesai",
    });

    // Reset Form
    setFormData({ fullName: "", email: "", password: "", role: "karyawan" });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
        {/* Header Form */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <UserPlus size={24} />
          </div>
          <h2 className="text-xl font-black text-stone-800 sm:text-2xl">
            Tambah Karyawan / User Baru
          </h2>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Daftarkan staf atau manajer operasional baru ke sistem DimsumKu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Nama Lengkap */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Nama Lengkap
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
              Email Karyawan
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
              Password Initial
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <input
                type="password"
                required
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
              Pilih Role Akses
            </label>
            <div className="relative">
              <ShieldCheck
                className="absolute left-3.5 top-3 text-stone-400"
                size={16}
              />
              <select
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
          <div className="mt-2 flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-3 text-[11px] text-amber-800">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Terisolasi Aman:</strong> Menambahkan akun karyawan tidak
              akan mengubah atau mengeluarkan akun Manajer Anda yang sedang aktif.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                Memproses Pendaftaran...
              </>
            ) : (
              "Simpan Karyawan Baru"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
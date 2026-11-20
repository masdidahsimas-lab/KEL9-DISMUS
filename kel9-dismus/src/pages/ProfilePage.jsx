import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  ShieldCheck,
  Calendar,
  LoaderCircle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";

export default function ProfilePage({ user, role = "pelanggan", onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Form Profil Informasi Diri
  const [form, setForm] = useState({
    nama: "",
    email: "",
    phone: "",
    alamat: "",
  });

  // Form Ubah Password
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        nama:
          user.user_metadata?.full_name ||
          user.user_metadata?.nama ||
          user.email?.split("@")[0] ||
          "",
        email: user.email || "",
        phone: user.user_metadata?.phone || user.user_metadata?.no_hp || "",
        alamat: user.user_metadata?.alamat || "",
      });
    }
  }, [user]);

  // Realtime listener jika data profil/role diubah di database
  useEffect(() => {
    const channel = supabase
      .channel("profile-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => {
          onRefresh?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle Update Informasi Profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!form.nama.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nama Tidak Boleh Kosong",
        text: "Silakan masukkan nama lengkap Anda.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: form.nama.trim(),
          nama: form.nama.trim(),
          phone: form.phone.trim(),
          no_hp: form.phone.trim(),
          alamat: form.alamat.trim(),
        },
      });

      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Profil Diperbarui!",
        text: "Informasi profil Anda berhasil disimpan.",
        timer: 1800,
        showConfirmButton: false,
      });

      if (onRefresh) await onRefresh();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Memperbarui Profil",
        text: err.message || "Terjadi kesalahan saat menyimpan perubahan.",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Ubah Password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.newPassword) {
      Swal.fire({
        icon: "warning",
        title: "Password Kosong",
        text: "Masukkan password baru Anda.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Terlalu Pendek",
        text: "Password minimal terdiri dari 6 karakter.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Tidak Cocok",
        text: "Konfirmasi password baru tidak sesuai.",
        confirmButtonColor: "#e11d48",
      });
      return;
    }

    setPassLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      setPasswordForm({ newPassword: "", confirmPassword: "" });

      Swal.fire({
        icon: "success",
        title: "Password Berhasil Diubah",
        text: "Gunakan password baru Anda untuk masuk di sesi berikutnya.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengubah Password",
        text: err.message || "Terjadi kesalahan sistem.",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setPassLoading(false);
    }
  };

  // Format Tanggal Terdaftar
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const isManager = role === "manajer" || role === "manager";
  const isStaff = role === "karyawan";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-black text-stone-800">Profil Saya</h1>
        <p className="text-xs text-stone-500 mt-1">
          Kelola informasi pribadi, identitas akun, dan keamanan kata sandi Anda.
        </p>
      </div>

      {/* Grid Utama Profil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KARTU KIRI: KARTU IDENTITAS USER */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs text-center flex flex-col items-center">
            {/* Avatar Badge */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-3xl flex items-center justify-center shadow-lg uppercase">
                {form.nama ? form.nama.charAt(0) : "U"}
              </div>
              <div className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md">
                <ShieldCheck className="text-emerald-600" size={18} />
              </div>
            </div>

            {/* Nama & Email */}
            <h2 className="text-lg font-extrabold text-stone-800">
              {form.nama || "Pengguna DimsumKu"}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{form.email}</p>

            {/* Badge Role */}
            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${
                  isManager
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : isStaff
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                <User size={14} />
                <span>
                  {isManager
                    ? "Role: Manajer Resto"
                    : isStaff
                    ? "Role: Karyawan Resto"
                    : "Role: Pelanggan Setia"}
                </span>
              </span>
            </div>

            {/* Meta Info */}
            <div className="w-full mt-6 border-t border-stone-100 pt-4 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1.5 text-stone-500 font-semibold">
                  <Calendar size={14} /> Terdaftar:
                </span>
                <span className="font-bold text-stone-800">{joinedDate}</span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span className="flex items-center gap-1.5 text-stone-500 font-semibold">
                  <CheckCircle2 size={14} className="text-emerald-600" /> Status
                  Akun:
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Aktif & Terverifikasi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU KANAN: FORM EDIT PROFIL & UBAH PASSWORD */}
        <div className="lg:col-span-2 space-y-6">
          {/* FORM INFORMASI PRIBADI */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <User className="text-amber-600" size={20} />
              <h3 className="font-extrabold text-stone-800 text-base">
                Informasi Pribadi
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-3 text-stone-400"
                      size={16}
                    />
                    <input
                      type="text"
                      required
                      value={form.nama}
                      onChange={(e) =>
                        setForm({ ...form, nama: e.target.value })
                      }
                      placeholder="Masukkan nama Anda"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-9 pr-4 py-2.5 text-xs font-semibold text-stone-800 outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Alamat Email (Akun)
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-3 text-stone-400"
                      size={16}
                    />
                    <input
                      type="email"
                      disabled
                      value={form.email}
                      className="w-full rounded-2xl border border-stone-200 bg-stone-100 pl-9 pr-4 py-2.5 text-xs font-semibold text-stone-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* No WhatsApp / Telepon */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Nomor WhatsApp / Telepon
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-3 text-stone-400"
                    size={16}
                  />
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-9 pr-4 py-2.5 text-xs font-semibold text-stone-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Alamat Domisili / Pengiriman */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Alamat Lengkap{" "}
                  {role === "pelanggan" && "(Untuk Pengiriman / Delivery)"}
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-3.5 text-stone-400"
                    size={16}
                  />
                  <textarea
                    rows="3"
                    required
                    value={form.alamat}
                    onChange={(e) =>
                      setForm({ ...form, alamat: e.target.value })
                    }
                    placeholder="Masukkan jalan, no. rumah, RT/RW, kecamatan, kota..."
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-9 pr-4 py-2.5 text-xs font-semibold text-stone-800 outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition"
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>

          {/* FORM UBAH KATA SANDI */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <KeyRound className="text-amber-600" size={20} />
              <h3 className="font-extrabold text-stone-800 text-base">
                Keamanan & Ubah Password
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password Baru */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-3 text-stone-400"
                      size={16}
                    />
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Minimal 6 karakter"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-9 pr-4 py-2.5 text-xs font-semibold text-stone-800 outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-3 text-stone-400"
                      size={16}
                    />
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Ulangi password baru"
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 pl-9 pr-4 py-2.5 text-xs font-semibold text-stone-800 outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="flex items-center gap-2 rounded-2xl bg-stone-800 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-stone-900 active:scale-95 disabled:opacity-50 transition"
                >
                  {passLoading ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <KeyRound size={16} />
                  )}
                  <span>Ubah Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
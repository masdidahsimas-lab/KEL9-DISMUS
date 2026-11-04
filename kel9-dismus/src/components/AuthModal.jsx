import { useState } from "react";
import { X, Lock, Mail, User, LoaderCircle, ShieldCheck } from "lucide-react";
import { loginUser, registerUser } from "../services/authService";

export default function AuthModal({ open, onClose, onSuccess, onError }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("pelanggan");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const res = isRegister
      ? await registerUser(email, password, fullName, role)
      : await loginUser(email, password);

    setLoading(false);

    if (res.error) {
      onError(`Autentikasi gagal: ${res.error.message}`);
      return;
    }

    onSuccess(res.data.user);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-stone-800">
            {isRegister ? "Buat Akun" : "Masuk Akun"}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            {isRegister
              ? "Daftarkan akun untuk pelanggan, karyawan, atau manager."
              : "Masuk untuk melanjutkan ke dashboard Anda."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-stone-400" size={18} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-stone-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-stone-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                Role
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-2.5 text-stone-400" size={18} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="pelanggan">Pelanggan</option>
                  <option value="karyawan">Karyawan</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : isRegister ? (
              "Daftar & Lanjut"
            ) : (
              "Masuk & Lanjut"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-semibold text-amber-600 hover:underline"
          >
            {isRegister
              ? "Sudah punya akun? Masuk"
              : "Belum punya akun? Daftar"}
          </button>
        </div>
      </div>
    </div>
  );
}
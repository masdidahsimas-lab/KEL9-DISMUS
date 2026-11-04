import { useState } from "react";
import { X, Lock, Mail, User, LoaderCircle } from "lucide-react";
import Swal from "sweetalert2";
import { loginUser, registerUser, loginWithGoogle } from "../services/authService";
import { validateInput } from "../utils/validation";

export default function AuthModal({ open, onClose, onSuccess, onError }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  if (!open) return null;

  // Handler Login dengan Google
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await loginWithGoogle();
    
    if (error) {
      setGoogleLoading(false);
      Swal.fire({
        icon: "error",
        title: "Gagal Login Google",
        text: error.message || "Terjadi kesalahan saat menghubungkan ke akun Google.",
        confirmButtonColor: "#d97706",
      });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const errors = {};

    if (isRegister) {
      const fullNameError = validateInput({
        field: "Nama lengkap",
        value: fullName,
        required: true,
        type: "string",
        minLength: 2,
        format: /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/,
      });
      if (fullNameError) errors.fullName = fullNameError;
    }

    const emailError = validateInput({
      field: "Email",
      value: email,
      required: true,
      type: "email",
    });
    if (emailError) errors.email = emailError;

    const passwordError = validateInput({
      field: "Password",
      value: password,
      required: true,
      type: "string",
      minLength: 6,
    });
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      Swal.fire({
        icon: "error",
        title: "Input Tidak Valid",
        text: Object.values(errors)[0],
        confirmButtonColor: "#d97706",
      });
      return;
    }

    setLoading(true);
    setFieldErrors({});

    try {
      const res = isRegister
        ? await registerUser(email.trim(), password, fullName.trim())
        : await loginUser(email.trim(), password);

      if (res?.error) {
        const rawMsg = res.error.message || "Gagal melakukan autentikasi.";
        onError?.(`Autentikasi gagal: ${rawMsg}`);

        const displayMsg = rawMsg.includes("Invalid login credentials")
          ? "Email atau password yang Anda masukkan salah."
          : rawMsg;

        Swal.fire({
          icon: "error",
          title: isRegister ? "Gagal Mendaftar" : "Gagal Masuk",
          text: displayMsg,
          confirmButtonColor: "#d97706",
        });
        return;
      }

      if (!res?.data?.user) {
        Swal.fire({
          icon: "error",
          title: "Gagal Autentikasi",
          text: "Data pengguna tidak ditemukan.",
          confirmButtonColor: "#d97706",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: isRegister ? "Registrasi Berhasil!" : "Berhasil Masuk!",
        text: isRegister
          ? "Akun Anda berhasil dibuat. Silakan jelajahi menu."
          : `Selamat datang kembali, ${
              res.data.user.user_metadata?.full_name || res.data.user.email
            }!`,
        timer: 1800,
        showConfirmButton: false,
      });

      onSuccess?.(res.data.user);
      onClose?.();
    } catch (error) {
      const errText = error?.message || "Silakan coba kembali beberapa saat lagi.";
      onError?.(`Terjadi kesalahan: ${errText}`);

      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: errText,
        confirmButtonColor: "#d97706",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setIsRegister(!isRegister);
    setEmail("");
    setPassword("");
    setFullName("");
    setFieldErrors({});
  }

  const getInputStyle = (fieldName) =>
    `w-full rounded-xl border py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
      fieldErrors[fieldName]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900"
        : "border-stone-200 focus:border-amber-500 focus:ring-amber-500/20"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={loading || googleLoading}
          className="absolute right-4 top-4 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
          aria-label="Tutup modal"
        >
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Lock size={24} />
          </div>

          <h3 className="text-xl font-bold text-stone-800">
            {isRegister ? "Buat Akun Pelanggan" : "Masuk Akun"}
          </h3>

          <p className="mt-1 text-xs text-stone-500">
            {isRegister
              ? "Daftarkan akun Anda untuk mulai memesan."
              : "Masuk untuk melanjutkan ke akun Anda."}
          </p>
        </div>

        {/* Tombol Login Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95 disabled:opacity-50"
        >
          {googleLoading ? (
            <LoaderCircle className="animate-spin text-amber-600" size={18} />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isRegister ? "Daftar dengan Google" : "Masuk dengan Google"}</span>
        </button>

        {/* Pemisah ATAU */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-full border-t border-stone-200"></div>
          <span className="absolute bg-white px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            atau email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isRegister && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-stone-400" size={18} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: null });
                  }}
                  placeholder="Nama Anda"
                  autoComplete="name"
                  className={getInputStyle("fullName")}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-stone-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                }}
                placeholder="nama@email.com"
                autoComplete="email"
                className={getInputStyle("email")}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-600">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-stone-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                }}
                placeholder="Minimal 6 karakter"
                autoComplete={isRegister ? "new-password" : "current-password"}
                className={getInputStyle("password")}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                Memproses...
              </>
            ) : isRegister ? (
              "Daftar Akun"
            ) : (
              "Masuk & Lanjut"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading || googleLoading}
            className="text-xs font-semibold text-amber-600 hover:underline disabled:opacity-50"
          >
            {isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
          </button>
        </div>
      </div>
    </div>
  );
}
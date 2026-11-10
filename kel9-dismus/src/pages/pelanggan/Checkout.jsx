import React, { useState, useEffect } from "react";
import {
  QrCode,
  Banknote,
  User,
  Phone,
  FileText,
  Sparkles,
  LoaderCircle,
  ShoppingBag,
  AlertCircle,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import Swal from "sweetalert2";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { createOrder, updateOrderStatus } from "../../services/orderService";
import { supabase } from "../../lib/supabase";
import { rupiah } from "../../utils/format";

export default function Checkout({
  onOrderSuccess,
  onRefresh,
  onOpenAuth,
  onNavigate,
}) {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [phone, setPhone] = useState("");
  const [catatan, setCatatan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // '' | 'QRIS' | 'Cash'
  const [submitting, setSubmitting] = useState(false);

  // Format QR String dinamis berbasis nominal
  const qrisDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226680016COM.GO-JEK.WWW0118936009143000000000021520040300003033605802ID5913DISMUS%20DIMSUM6013JAKARTA%20SELATAN61051219062070703A016304`;

  // 1. Cek Autentikasi Pengguna
  useEffect(() => {
    if (!user && typeof onOpenAuth === "function") {
      onOpenAuth("login");
    }
  }, [user, onOpenAuth]);

  // 2. Jika User Belum Login
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[400px] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 shadow-inner">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-stone-800">
          Login Diperlukan
        </h2>
        <p className="mt-2 text-xs text-stone-500 leading-relaxed">
          Silakan masuk ke akun Anda untuk melanjutkan proses checkout & pembayaran dimsum.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => onOpenAuth && onOpenAuth("login")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-95"
          >
            <LogIn size={16} />
            <span>Login Sekarang</span>
          </button>
          
          <button
            onClick={() => onNavigate && onNavigate("katalog")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white py-3 text-xs font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Katalog</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Fungsi Membuat Pesanan & Handler Simulasi QRIS
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Keranjang Kosong",
        text: "Silakan pilih menu dimsum terlebih dahulu.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    if (!paymentMethod) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Metode Pembayaran",
        text: "Silakan pilih metode pembayaran (QRIS Instant atau Cash/Tunai) terlebih dahulu.",
        confirmButtonColor: "#d97706",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Simpan pesanan awal ke Supabase
      const res = await createOrder({
        pelanggan_id: user?.id,
        items: cart,
        metode_pembayaran: paymentMethod,
        catatan: catatan,
      });

      if (res?.error) {
        throw new Error(res.error.message || res.error);
      }

      const orderId = res.data?.id;
      const kodePesanan = res.data?.kode_pesanan || "DS-OK";

      if (paymentMethod === "QRIS") {
        const result = await Swal.fire({
          title: "Scan QRIS untuk Pembayaran",
          html: `
            <div style="text-align: center; font-size: 13px; color: #44403c;">
              <p style="margin-bottom: 12px; color: #78716c;">
                Pesanan Anda telah dibuat! Silakan scan QR Code di bawah menggunakan aplikasi E-Wallet atau M-Banking Anda.
              </p>
              
              <div style="background-color: #ffffff; border: 1.5px solid #e7e5e4; padding: 12px; border-radius: 20px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 12px;">
                <img src="${qrisDataUrl}" alt="QRIS Dimsum" style="width: 200px; height: 200px; display: block; margin: 0 auto; border-radius: 8px;" />
                <span style="font-size: 10px; font-weight: 800; color: #a8a29e; letter-spacing: 1px; display: block; margin-top: 6px;">NMID: ID10200392819</span>
              </div>

              <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 10px 14px; border-radius: 14px; margin-bottom: 10px;">
                <span style="font-size: 11px; color: #b45309; font-weight: 600;">Total Nominal: </span>
                <strong style="font-size: 16px; color: #b45309; font-weight: 800;">${rupiah(totalPrice)}</strong>
              </div>

              <p style="font-size: 12px; color: #78716c;">
                Kode Pesanan: <strong style="font-family: monospace; color: #292524;">${kodePesanan}</strong>
              </p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "⚡ Simulasi Bayar QRIS",
          cancelButtonText: "Bayar Nanti",
        });

        // JIKA TOMBOL "Simulasi Bayar QRIS" DIKLIK
        if (result.isConfirmed && orderId) {
          // 1. Ubah status pesanan menjadi 'Dikonfirmasi'
          await updateOrderStatus(orderId, "Dikonfirmasi");

          // 2. Ubah status pembayaran di tabel pembayaran menjadi 'Lunas'
          await supabase
            .from("pembayaran")
            .update({ status_pembayaran: "Lunas" })
            .eq("pesanan_id", orderId);

          await Swal.fire({
            icon: "success",
            title: "Pembayaran QRIS Berhasil!",
            text: `Pesanan ${kodePesanan} telah terverifikasi lunas dan otomatis berstatus Dikonfirmasi.`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } else {
        // PETUNJUK PEMBAYARAN CASH
        await Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil Dibuat!",
          html: `
            <div style="text-align: left; font-size: 13px; color: #44403c;">
              <p style="margin-bottom: 12px; text-align: center;">Terima kasih! Pesanan Anda telah tercatat di sistem.</p>
              
              <div style="background-color: #fef3c7; border: 1.5px dashed #d97706; padding: 12px; border-radius: 16px; text-align: center; margin-bottom: 14px;">
                <span style="font-size: 11px; color: #b45309; font-weight: 700; display: block; letter-spacing: 0.5px;">KODE PESANAN ANDA:</span>
                <span style="font-size: 22px; font-weight: 900; color: #78350f; font-family: monospace;">${kodePesanan}</span>
              </div>

              <div style="background-color: #faf8f7; border: 1px solid #e7e5e4; padding: 14px; border-radius: 16px;">
                <strong style="color: #292524; font-size: 13px; display: block; margin-bottom: 6px;">📌 Cara Pembayaran di Kasir:</strong>
                <ol style="margin-left: 18px; margin-top: 4px; padding-left: 0; line-height: 1.6;">
                  <li>Datangi area <strong>Kasir Dismus Dimsum</strong>.</li>
                  <li>Tunjukkan <strong>Kode Pesanan (${kodePesanan})</strong> ini kepada kasir.</li>
                  <li>Lakukan pembayaran sebesar <strong style="color: #d97706;">${rupiah(totalPrice)}</strong> secara tunai.</li>
                  <li>Pesanan Anda akan langsung diproses oleh tim dapur!</li>
                </ol>
              </div>
            </div>
          `,
          confirmButtonColor: "#d97706",
          confirmButtonText: "Saya Mengerti, Lihat Pesanan",
        });
      }

      clearCart();

      // Refresh data aplikasi agar pesanan langsung masuk ke tampilan Admin & Riwayat
      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      if (onOrderSuccess) {
        onOrderSuccess();
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Membuat Pesanan",
        text: err.message || "Terjadi kesalahan pada server.",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header Halaman */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-800">
          <Sparkles size={14} /> Konfirmasi Instan
        </div>
        <h1 className="mt-2 text-2xl font-black text-stone-800 sm:text-3xl">
          Pembayaran & Check-Out
        </h1>
        <p className="mt-1 text-xs text-stone-500 sm:text-sm">
          Periksa kembali rincian dimsum Anda dan pilih metode pembayaran.
        </p>
      </div>

      <form
        onSubmit={handleCreateOrder}
        className="grid grid-cols-1 gap-8 lg:grid-cols-12"
      >
        {/* Kolom Kiri: Form & Metode Pembayaran */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card Data Pemesan */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-stone-800">
              <User className="text-amber-600" size={18} /> Data Pemesan
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    user?.user_metadata?.full_name ||
                    user?.profile?.nama_lengkap ||
                    user?.email ||
                    "Pelanggan Dimsum"
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Nomor WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3.5 top-3 text-stone-400"
                    size={16}
                  />
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Catatan Pesanan (Opsional)
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-3.5 top-3 text-stone-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Contoh: Sambal dipisah, meja nomor 5..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Pilih Metode Pembayaran */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-stone-800">
              <Banknote className="text-amber-600" size={18} /> Pilih Pembayaran
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("QRIS")}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                  paymentMethod === "QRIS"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                    : "border-stone-200 hover:border-amber-300 bg-white"
                }`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <QrCode size={22} />
                </div>
                <span className="text-sm font-bold text-stone-800">
                  QRIS Instant
                </span>
                <span className="mt-0.5 text-[11px] text-stone-500">
                  GoPay, OVO, Dana, ShopeePay
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("Cash")}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                  paymentMethod === "Cash"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                    : "border-stone-200 hover:border-amber-300 bg-white"
                }`}
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Banknote size={22} />
                </div>
                <span className="text-sm font-bold text-stone-800">
                  Cash / Tunai
                </span>
                <span className="mt-0.5 text-[11px] text-stone-500">
                  Bayar langsung di Kasir
                </span>
              </button>
            </div>

            {!paymentMethod && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50/80 p-3 text-xs font-medium text-amber-800 border border-amber-200/60">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>Silakan pilih salah satu metode pembayaran di atas.</span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan */}
        <div className="space-y-6 lg:col-span-5">
          <div className="sticky top-24 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-base font-bold text-stone-800">
              <ShoppingBag className="text-amber-600" size={18} /> Ringkasan Dimsum
            </h2>

            <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="text-center text-xs text-stone-400">
                  Belum ada item di keranjang.
                </p>
              ) : (
                cart.map((item) => {
                  const qty = item.qty || item.jumlah || 1;
                  const price = item.price || item.harga || 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-800">
                          {item.nama_menu || item.name}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {qty} x {rupiah(price)}
                        </span>
                      </div>
                      <span className="font-bold text-stone-700">
                        {rupiah(price * qty)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 border-t border-dashed border-stone-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal Pesanan</span>
                <span>{rupiah(totalPrice)}</span>
              </div>

              {paymentMethod === "QRIS" && (
                <div className="flex justify-between text-stone-500 transition-all duration-300">
                  <span>Biaya Layanan / QRIS</span>
                  <span className="text-emerald-600 font-semibold">Gratis</span>
                </div>
              )}

              <div className="flex justify-between border-t pt-3 text-sm font-black text-stone-800">
                <span>Total Bayar</span>
                <span className="text-base text-amber-600">
                  {rupiah(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  Memproses Pesanan...
                </>
              ) : (
                "Buat Pesanan Sekarang"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
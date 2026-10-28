import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

export default function Checkout({ onOrderSuccess }) {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simpan transaksi ke tabel 'orders' Supabase
      const { data, error } = await supabase.from('orders').insert([
        {
          user_id: user.id,
          total_amount: totalPrice,
          address: address,
          phone: phone,
          payment_method: paymentMethod,
          items: cart,
          status: 'Pending',
        },
      ]);

      if (error) throw error;

      clearCart();
      onOrderSuccess();
    } catch (err) {
      alert('Gagal membuat pesanan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📝</span> Konfirmasi Pesanan & Pembayaran
      </h1>

      <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Pengiriman */}
        <div className="md:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-700 text-sm border-b pb-2">Informasi Pengiriman</h2>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nama Pemesan</label>
            <input
              type="text"
              disabled
              value={user?.user_metadata?.full_name || user?.email}
              className="w-full px-3 py-2 text-sm bg-gray-50 border rounded-xl text-gray-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nomor WhatsApp</label>
            <input
              type="tel"
              required
              placeholder="08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Alamat Lengkap</label>
            <textarea
              required
              rows={3}
              placeholder="Jl. Merdeka No. 12, RT 02/03..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            ></textarea>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Metode Pembayaran</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="QRIS">QRIS / GoPay / OVO</option>
              <option value="Transfer Bank">Transfer Bank BCA</option>
              <option value="COD">Bayar di Tempat (COD)</option>
            </select>
          </div>
        </div>

        {/* Ringkasan Belanja */}
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 h-fit space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm border-b border-orange-200 pb-2">Ringkasan Dimsum</h2>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-xs text-gray-700">
                <span>{item.name} x{item.qty}</span>
                <span className="font-semibold">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-orange-200 pt-3 flex justify-between font-bold text-sm text-gray-800">
            <span>Total:</span>
            <span className="text-orange-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition text-xs shadow-md disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan Sekarang'}
          </button>
        </div>
      </form>
    </div>
  );
}
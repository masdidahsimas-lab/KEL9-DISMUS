
import { X, ShoppingBag, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer({ onCheckout }) {
  const {
    cart = [],
    updateQty,
    totalPrice = 0,
    cartOpen,
    setCartOpen,
  } = useCart();

  if (!cartOpen) return null;

  const formatPrice = (price) =>
    `Rp ${Number(price || 0).toLocaleString("id-ID")}`;

  const handleCheckout = () => {
    setCartOpen(false);

    if (typeof onCheckout === "function") {
      onCheckout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-sm">
      {/* Cart Drawer */}
      <div className="flex h-full w-full max-w-md flex-col justify-between bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-amber-600" size={20} />

            <h2 className="font-bold text-stone-800">
              Keranjang Belanja
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Tutup keranjang"
            className="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Items */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-stone-400">
              <span className="mb-3 text-5xl">🥟</span>

              <p className="text-sm font-medium">
                Keranjang kamu masih kosong.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/50 p-3"
              >
                {/* Item Information */}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xs font-bold text-stone-800">
                    {item.name}
                  </h4>

                  <p className="mt-0.5 text-xs font-semibold text-amber-600">
                    {formatPrice((item.price ?? item.harga ?? 0) * item.qty)}
                  </p>
                </div>

                {/* Quantity Control */}
                <div className="ml-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2 py-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    aria-label={`Kurangi jumlah ${item.name}`}
                    className="p-0.5 text-stone-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="w-5 text-center text-xs font-bold text-stone-800">
                    {item.qty}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    aria-label={`Tambah jumlah ${item.name}`}
                    className="p-0.5 text-stone-500 transition hover:text-amber-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Action */}
        {cart.length > 0 && (
          <div className="space-y-3 border-t border-stone-100 bg-white p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">
                Total Pembayaran
              </span>

              <span className="text-base font-extrabold text-amber-600">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-95"
            >
              Lanjut ke Pembayaran →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

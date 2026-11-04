
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "dismus_cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);

      if (!saved) return [];

      const parsedCart = JSON.parse(saved);

      return Array.isArray(parsedCart) ? parsedCart : [];
    } catch (error) {
      console.error("Gagal membaca data keranjang:", error);
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  // Simpan keranjang ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Gagal menyimpan keranjang:", error);
    }
  }, [cart]);

  // Menambahkan produk ke keranjang
  const addToCart = (item) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      }

      return [...prev, { ...item, qty: 1 }];
    });
  };

  // Menambah atau mengurangi jumlah produk
  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty + delta }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  // Menghapus seluruh produk dari keranjang
  const clearCart = () => {
    setCart([]);
  };

  // Menghitung total jumlah produk
  const totalItems = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  // Menghitung total harga
  const totalPrice = cart.reduce((sum, item) => {
    const price = Number(item.price ?? item.harga ?? 0);

    return sum + price * item.qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        clearCart,
        totalItems,
        totalPrice,
        cartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook untuk menggunakan CartContext
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart harus digunakan di dalam CartProvider"
    );
  }

  return context;
}

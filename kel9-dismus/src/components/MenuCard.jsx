import React from 'react';
import { useCart } from '../context/CartContext';

export default function MenuCard({ item }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="h-40 bg-orange-50 flex items-center justify-center text-6xl relative overflow-hidden">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span>🥟</span>
          )}
          <span className="absolute top-2 right-2 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-semibold text-orange-800">
            {item.category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
        </div>
      </div>

      <div className="p-4 pt-0 flex items-center justify-between mt-2">
        <span className="font-bold text-orange-600 text-base">
          Rp {item.price.toLocaleString('id-ID')}
        </span>
        <button
          onClick={() => addToCart(item)}
          className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
        >
          <span>+ Tambah</span>
        </button>
      </div>
    </div>
  );
}
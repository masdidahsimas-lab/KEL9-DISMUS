import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, activeTab, setActiveTab }) {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-orange-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('catalog')} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-2xl">🥟</span>
          <span className="font-bold text-xl text-orange-600 tracking-tight">Dismus Dimsum</span>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'catalog' ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            Katalog Menu
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'dashboard' ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              Pesanan Saya
            </button>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Profile / Login */}
          {user ? (
            <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
              <span className="text-xs font-medium text-gray-700 hidden sm:inline">
                {user.user_metadata?.full_name || user.email.split('@')[0]}
              </span>
              <button
                onClick={logout}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg font-medium transition shadow-sm"
            >
              Masuk
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
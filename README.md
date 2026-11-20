🥟 DimsumKu — Sistem Pemesanan & Manajemen Operasional Dimsum

DimsumKu (KEL9-DISMUS) adalah aplikasi web terintegrasi untuk manajemen operasional kedai dimsum dan portal pemesanan pelanggan berbasis React, Tailwind CSS, dan Supabase. Aplikasi ini mendukung sinkronisasi data secara real-time, manajemen resep berbasis skala adonan, pemotongan stok gudang otomatis, serta pembagian hak akses (Role-Based Access Control) untuk Pelanggan, Karyawan, dan Manajer.

✨ Fitur Utama

1. 🛍️ Portal Pelanggan (pelanggan)

Katalog Menu Interaktif: Menampilkan daftar menu dimsum beserta ketersediaan porsi secara real-time berdasarkan stok bahan baku aktual.

Keranjang Belanja (CartDrawer): Tambah, kurangi, dan hitung total belanja secara otomatis.

Checkout & Riwayat Pesanan: Proses pemesanan cepat dengan pelacakan status pesanan (Menunggu, Diproses, Selesai, Dibatalkan).

Autentikasi Fleksibel: Login dan registrasi menggunakan Email/Password (dengan validasi mandatory real-time) maupun Google OAuth.

2. 👨‍🍳 Panel Karyawan (karyawan)

Dashboard Operasional: Ringkasan statistik pesanan, ketersediaan menu, stok menipis, serta grafik pendapatan harian.

Manajemen Pesanan: Memantau pesanan masuk secara real-time dan memperbarui status pemrosesan pesanan.

Manajemen Menu & Resep (RecipeModal):

Mengatur konversi skala produksi (Hasil 1 Adonan (pcs) dan Isi 1 Porsi (pcs)).

Menghubungkan takaran bahan baku per adonan dengan opsi pemotongan stok gudang otomatis.

Proteksi validasi otomatis yang mencegah penyimpanan resep apabila stok bahan baku di gudang bernilai 0 atau tidak mencukupi.

Manajemen Stok Bahan Baku: Mencatat, memperbarui, dan memantau sisa stok bahan baku di gudang.

3. 🧑‍💼 Panel Manajer (manajer)

Seluruh Fitur Panel Karyawan ditambah kontrol penuh atas laporan dan manajemen tim.

Laporan Penjualan (ManagerReports): Rekapitulasi transaksi dan analisis performa penjualan.

Kelola Karyawan (KelolaKaryawan):

Mendaftarkan akun staf baru melalui modal Tambah Karyawan secara terisolasi (tidak mengeluarkan sesi login Manajer yang sedang aktif).

Mengubah data profil/role karyawan serta menghapus akun staf dengan pembaruan daftar real-time.

4. 🎨 Antarmuka & Pengalaman Pengguna (UI/UX)

Responsive & Collapsible Sidebar: Navigasi samping yang dapat diperkecil (collapse) di layar desktop, berbentuk drawer di perangkat mobile, dan mendukung scroll otomatis.

Validasi Form Mandatory & Real-Time: Seluruh formulir dilengkapi indikator kolom wajib (*), validasi langsung saat mengetik, dan notifikasi interaktif menggunakan SweetAlert2.

🛠️ Teknologi yang Digunakan

Frontend Framework: React (Vite)

Styling: Tailwind CSS

Icons: Lucide React

Alert & Notifikasi: SweetAlert2

Backend, Database & Auth: Supabase (PostgreSQL, Supabase Auth, Supabase Realtime, Database Functions / RPC)

📂 Struktur Direktori

src/
├── components/          # Komponen UI reusable
│   ├── AuthModal.jsx        # Modal Login & Register (Email + Google)
│   ├── CartDrawer.jsx       # Drawer keranjang belanja pelanggan
│   ├── DashboardChart.jsx   # Grafik penjualan harian real-time
│   ├── EmptyState.jsx       # Tampilan saat data kosong
│   ├── Header.jsx           # Topbar navigasi, keranjang, refresh, & logout
│   ├── MenuCard.jsx         # Kartu item menu pada katalog
│   ├── Modal.jsx            # Komponen modal & form field dasar
│   ├── Navbar.jsx           # Navigasi alternatif pelanggan
│   ├── RecipeModal.jsx      # Modal pengaturan resep, skala porsi & validasi stok
│   └── Sidebar.jsx          # Sidebar navigasi responsif (buka-tutup & scrollable)
├── context/             # State management global
│   ├── AuthContext.jsx      # Konteks sesi pengguna
│   └── CartContext.jsx      # Konteks keranjang belanja
├── lib/
│   └── supabase.js          # Inisialisasi Supabase client
├── pages/               # Halaman utama aplikasi
│   ├── Dashboard.jsx        # Dashboard internal staf & manajer
│   ├── MenuPage.jsx         # Halaman kelola daftar menu
│   ├── OrdersPage.jsx       # Halaman manajemen pesanan masuk
│   ├── ProfilePage.jsx      # Halaman profil pengguna
│   ├── StockPage.jsx        # Halaman kelola stok bahan baku
│   ├── manajer/
│   │   ├── KelolaKaryawan.jsx   # CRUD akun karyawan + modal tambah staf
│   │   ├── ManagerReports.jsx   # Laporan keuangan & penjualan
│   │   └── MenuManagement.jsx   # Konfigurasi resep & stok porsi menu
│   └── pelanggan/
│       ├── Checkout.jsx         # Halaman pembayaran & konfirmasi pesanan
│       ├── CustomerCatalog.jsx  # Katalog pemesanan dimsum
│       ├── CustomerHistory.jsx  # Riwayat transaksi pelanggan
│       └── DashboardCust.jsx    # Dashboard ringkasan pelanggan
├── services/            # Integrasi API & logika bisnis Supabase
│   ├── authService.js       # Login, register, Google OAuth, & addUserByManager
│   ├── orderService.js      # Pengambilan & pembaruan status pesanan
│   ├── recipeService.js     # Kalkulasi porsi & pemotongan stok bahan baku
│   └── stockService.js      # CRUD data stok bahan baku
└── utils/               # Fungsi bantuan
    ├── format.js            # Pemformatan mata uang Rupiah & tanggal
    └── validation.js        # Validasi input formulir


🚀 Panduan Instalasi & Menjalankan Projek

1. Prasyarat

Node.js versi 18 atau lebih baru

Akun dan projek aktif di Supabase

2. Clone Repositori & Install Dependencies

git clone <url-repositori-anda>
cd kel9-dismus
npm install


3. Konfigurasi Environment Variable

Buat file .env pada direktori utama (root) projek dan isi dengan kredensial Supabase Anda:

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key


4. Konfigurasi Database Supabase

Pastikan tabel berikut sudah tersedia pada schema public di Supabase:

profiles / users (id, email, full_name, phone, role, created_at)

menus (id, nama_menu, harga, kategori, deskripsi, gambar, pcs_per_adonan, pcs_per_porsi)

bahan_baku (id, nama_bahan, jumlah_stok, satuan)

menu_bahan_baku (id, menu_id, bahan_id, jumlah_dibutuhkan)

pesanan (id, user_id, total_harga, status, tanggal_pesanan, created_at)

Aktifkan juga fitur Supabase Realtime pada tabel-tabel tersebut agar perubahan data langsung tersinkronisasi di seluruh klien.

5. Jalankan Server Pengembangan

npm run dev


Buka browser dan akses http://localhost:5173.

👥 Tim Pengembang

Dikembangkan oleh Kelompok 9 — KEL9-DISMUS.

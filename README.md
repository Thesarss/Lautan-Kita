# Lautan Kita — README

## Ringkasan
- Aplikasi e‑commerce hasil laut yang menghubungkan Nelayan/Penjual langsung ke Pembeli dengan kontrol Admin.
- Fitur inti: katalog produk, keranjang, checkout, pembayaran, pengiriman, riwayat pesanan, dan audit admin.

## Peran & Hak Akses
- Admin: moderasi produk, kelola pengguna, kelola status pesanan, payout/audit.
- Pembeli: registrasi/login, lihat katalog, tambah ke keranjang, checkout, bayar, lacak pesanan.
- Nelayan/Penjual: buat produk, atur stok/harga, lihat pesanan terkait.

## Teknologi & Metode
- Backend: `Node.js` + `Express`, DB `MySQL` (XAMPP), autentikasi `JWT`.
- Validasi: `express-validator` pada semua endpoint input.
- Transaksi: operasi kritis (checkout, pembatalan, konfirmasi pembayaran/pengiriman) memakai transaksi DB.
- Frontend: HTML/CSS/JS statis, komunikasi `fetch` ke API dan helper `assets/js/api.js` untuk bearer token.

## Metodologi Pengembangan (Hybrid Waterfall + Agile)
- Tujuan: kombinasi stabilitas desain awal (Waterfall) dengan iterasi cepat berbasis umpan balik (Agile).
- Waterfall (perencanaan/kontrak awal):
  - Skema DB dan entitas utama ditetapkan di `toko_online.sql` sebagai kontrak sumber data.
  - Kontrak API ditata per domain pada `backend/src/routes/*` (Auth, Produk, Keranjang, Orders, Payments, Shipments, Admin).
  - Struktur arsitektur dan middleware (`backend/src/app.js`, `backend/src/middleware/auth.js`) dibuat dulu sebagai fondasi.
- Agile (iterasi/sprint berurutan):
  - Sprint 1: Auth JWT + validasi input (`auth.js`), endpoint `register/login/me`.
  - Sprint 2: Produk publik + buat produk penjual (`products.js`).
  - Sprint 3: Keranjang tambah/list/update/hapus (`carts.js`).
  - Sprint 4: Checkout pesanan dengan transaksi, restock saat batal (`orders.js`).
  - Sprint 5: Pembayaran: buat/konfirmasi manual, validasi metode (`payments.js`).
  - Sprint 6: Pengiriman: buat dan update status (`shipments.js`).
  - Sprint 7: Admin: ubah status pesanan, audit/payout (opsional) (`admin.js`).
  - Iterasi frontend: sinkronisasi beranda dengan API (`home_final.html`), pecah langkah checkout agar konfirmasi pembayaran manual (`checkout.html`).
- Praktik kualitas & operasional:
  - Validasi sistematis (`express-validator`), penanganan error terstandar (422/403/404/409/500).
  - Transaksi DB untuk konsistensi stok dan status.
  - Health check DB saat startup, CORS/preflight di backend.
  - Uji manual endpoint dengan token (curl/Postman) dan seed produk penjual untuk demo.

## Menjalankan Backend (XAMPP)
- Jalankan MySQL di XAMPP (port default `3306`).
- Import schema `toko_online.sql` ke DB `toko_online`.
- Buat `backend/.env` (contoh ada di `.env.example`):
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=3306`
  - `DB_USER=root`
  - `DB_PASSWORD=`
  - `DB_NAME=toko_online`
  - `JWT_SECRET=<string_acak>`
- Start server: `npm run start` di folder `backend` → tersedia di `http://localhost:4000`.

## Menjalankan Frontend
- Buka `home_final.html` di browser atau gunakan server statis (mis. VS Code Live Server).
- Halaman utama:
  - Beranda: `home_final.html`
  - Registrasi: `registrasi.html`
  - Login: `login.html`
  - Keranjang: `keranjang.html`
  - Checkout: `checkout.html`
  - Pembayaran sukses: `pembayaran-berhasil.html`
  - Rincian pesanan: `rincian-pesanan.html`
  - Pusat bantuan: `pusat_bantuan.html`

## Fitur Utama (Ringkas)
- Auth: `register`, `login`, `GET /auth/me`.
- Profil: `PATCH /auth/me` untuk ubah `nama`/`email` (cek unik email).
- Produk: list publik (`GET /products`), tambah oleh penjual.
- Keranjang: tambah/list/update/hapus item (terautentikasi).
- Checkout: membuat pesanan, mengurangi stok dengan transaksi.
- Pembayaran: buat pembayaran, konfirmasi manual, lihat status.
- Pengiriman: buat dan update status pengiriman (`admin/penjual`).
- Admin: ubah status pesanan, audit log (opsional).

## Status Proyek (per 2025-12-08)
- Backend API inti selesai dan teruji manual untuk domain: Auth, Produk, Keranjang, Pesanan, Pembayaran, Pengiriman, Admin.
- Upload gambar selesai: avatar pengguna (`/auth/avatar`) dan foto produk (di `/penjual/produk`). File disajikan via static `GET /uploads/*`.
- RBAC aktif: middleware mewajibkan peran yang tepat untuk setiap endpoint sensitif.
- Frontend tersinkron dengan API: beranda mengambil daftar dari `GET /products`, keranjang/checkout terhubung ke backend, profil dan avatar berjalan, registrasi mendukung pemilihan peran.
- Penjual: dapat menambah produk dengan foto, melihat produk miliknya, serta mengelola stok/harga. Fitur keranjang otomatis dinonaktifkan untuk akun penjual.

## Fungsi/Endpoint Selesai
- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
  - `PATCH /auth/me`
  - `POST /auth/avatar`
- Produk
  - `GET /products` (kini mengembalikan `photo_url`)
  - `POST /penjual/produk` (menerima `image` base64 opsional, menyimpan ke `/uploads/products/...`)
  - `GET /penjual/produk` (daftar produk milik penjual)
  - `PATCH /penjual/produk/:id` (update stok/harga dan field opsional lain)
- Keranjang (khusus `pembeli`)
  - `GET /carts`
  - `POST /carts/items`
  - `PATCH /carts/items/:itemId`
  - `DELETE /carts/items/:itemId`
- Pesanan
  - `POST /orders/checkout` (membuat pesanan dari keranjang, mengurangi stok per item)
  - `GET /orders` (riwayat pesanan pembeli)
  - `GET /orders/:id` (detail + items, termasuk `penjual_nama`)
  - `POST /orders/:id/cancel` (rollback stok bila dibatalkan saat status `menunggu`)
  - `GET /penjual/orders` (daftar pesanan yang berisi produk penjual)
  - `PATCH /admin/orders/:id/status` (ubah status oleh admin dengan logika restock saat dibatalkan)
- Pembayaran
  - `POST /payments` (membuat pembayaran untuk pesanan)
  - `POST /payments/:id/confirm` (konfirmasi pembayaran; order berpindah ke `diproses`)
  - `GET /orders/:orderId/payments`
- Pengiriman
  - `POST /shipments` (membuat pengiriman; jika tersedia di proyek)
  - `PATCH /shipments/:id` (kurir/admin mengubah `status_kirim` dan/atau `no_resi`; menandai pesanan `selesai` bila diterima)
- Admin
  - `PATCH /admin/users/:id/role` (ganti peran pengguna)
  - `PATCH /admin/products/:id/status` (aktif/nonaktif)
  - `PATCH /admin/reviews/:id/status` (aktif/disembunyikan)
  - Laporan penjualan dan payout: `GET /admin/reports/*`

## Implementasi Frontend Selesai
- Modal terpusat untuk notifikasi/konfirmasi (ganti semua `alert()` browser).
- Beranda (`home_final.html`)
  - Menarik produk dari backend, menampilkan `photo_url` jika ada.
  - Fallback gambar dinamis berdasarkan nama/kategori bila tidak ada foto.
  - Tombol aksi beradaptasi dengan peran: untuk `pembeli` ada keranjang/beli, untuk `penjual` tersedia tombol kelola stok.
  - Form “Tambah Produk Nelayan” dengan input foto + preview, kirim base64 ke backend.
- Profil (`views/profil.html`)
  - Menampilkan dan mengedit profil (`PATCH /auth/me`), upload avatar (`POST /auth/avatar`).
- Registrasi (`registrasi.html`)
  - Dropdown peran (pembeli/penjual/kurir), validasi dasar.
- Checkout (`checkout.html`)
  - Terhubung ke keranjang backend, konfirmasi pembayaran manual.

## Catatan Migrasi/Operasional
- Startup backend memastikan kolom:
  - `user.avatar_url` dan `produk.photo_url` dibuat otomatis jika belum ada.
- Direktori upload:
  - `backend/uploads/avatars`, `backend/uploads/products` dibuat otomatis.

## Ringkas Cara Coba Fitur Penjual
- Login sebagai penjual → buka menu Akun → “Tambah Produk” → isi nama/harga/stok/opsional kategori + foto → “Tambah”.
- Produk tampil di beranda; untuk kelola stok/harga, klik ikon box pada kartu produk.

## Cara Uji Cepat
- Login sebagai penjual dan tambahkan produk (`POST /penjual/produk`).
- Login sebagai pembeli, tambah ke keranjang (`POST /carts/items`).
- Checkout di `checkout.html` dan pilih metode pembayaran, lalu konfirmasi.

## Troubleshooting
- “Kesalahan jaringan” di `checkout.html`: pastikan backend aktif, token login ada, dan `assets/js/api.js` termuat.
- “Keranjang kosong”: tambahkan item lewat kartu produk backend (bukan ID string statis).
- CORS: backend sudah mengaktifkan preflight; akses via `http://127.0.0.1`/`http://localhost`.

## Akun Demo & Data Login
- Cara membuat cepat: gunakan halaman `registrasi.html` atau endpoint `POST /auth/register`.
- Peran yang didukung: `pembeli`, `penjual`, `admin`, `kurir`.
- Contoh kredensial (buat melalui registrasi):
  - Admin: `admin@lautankita.test` / `Admin12345`
  - Nelayan/Penjual: `suhardi@gmail.com` / `suhardi123`
  - Kurir: `kurir@lautankita.test` / `Kurir12345`
  - Pembeli: `pembeli@lautankita.test` / `Pembeli12345`
  - Catatan: Password minimal 8 karakter; email unik. Jika butuh akun siap pakai, jalankan registrasi untuk setiap peran lalu login di `login.html`.

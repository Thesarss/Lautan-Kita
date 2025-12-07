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
- Produk: list publik (`GET /products`), tambah oleh penjual.
- Keranjang: tambah/list/update/hapus item (terautentikasi).
- Checkout: membuat pesanan, mengurangi stok dengan transaksi.
- Pembayaran: buat pembayaran, konfirmasi manual, lihat status.
- Pengiriman: buat dan update status pengiriman (`admin/penjual`).
- Admin: ubah status pesanan, audit log (opsional).

## Cara Uji Cepat
- Login sebagai penjual dan tambahkan produk (`POST /penjual/produk`).
- Login sebagai pembeli, tambah ke keranjang (`POST /carts/items`).
- Checkout di `checkout.html` dan pilih metode pembayaran, lalu konfirmasi.

## Troubleshooting
- “Kesalahan jaringan” di `checkout.html`: pastikan backend aktif, token login ada, dan `assets/js/api.js` termuat.
- “Keranjang kosong”: tambahkan item lewat kartu produk backend (bukan ID string statis).
- CORS: backend sudah mengaktifkan preflight; akses via `http://127.0.0.1`/`http://localhost`.

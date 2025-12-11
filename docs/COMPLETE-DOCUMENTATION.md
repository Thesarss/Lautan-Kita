# 📚 Lautan Kita - Dokumentasi Lengkap

> **E-commerce Hasil Laut** - Menghubungkan Nelayan/Penjual langsung ke Pembeli

**Last Updated:** 10 Desember 2025  
**Version:** 1.0.0

---

## 📖 Daftar Isi

1. [Quick Start](#-quick-start)
2. [Teknologi & Arsitektur](#-teknologi--arsitektur)
3. [Fitur Utama](#-fitur-utama)
4. [Role & Permission](#-role--permission)
5. [Setup & Instalasi](#-setup--instalasi)
6. [Membuat Akun Admin](#-membuat-akun-admin)
7. [Dashboard System](#-dashboard-system)
8. [Admin Panel](#-admin-panel)
9. [API Endpoints](#-api-endpoints)
10. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Minimal Setup (5 Menit)

```bash
# 1. Start MySQL di XAMPP
# 2. Import database
mysql -u root toko_online < toko_online.sql

# 3. Setup backend
cd backend
npm install
cp .env.example .env
npm start

# 4. Buat admin
node create-admin.js

# 5. Buka browser
# http://localhost:3000/home_final.html
```

### Login Credentials

```
Admin    : admin@lautankita.com / Admin123456
```

---

## 🛠 Teknologi & Arsitektur

### Backend
- **Runtime:** Node.js v14+
- **Framework:** Express.js
- **Database:** MySQL (XAMPP)
- **Auth:** JWT (JSON Web Token)
- **Validation:** express-validator
- **Password:** bcrypt (10 rounds)

### Frontend
- **HTML5/CSS3/JavaScript** (Vanilla)
- **API Helper:** `assets/js/api.js`
- **Modal System:** Centralized notification
- **Responsive:** Mobile-friendly design

### Database
- **Schema:** `toko_online.sql`
- **Tables:** user, produk, pesanan, pembayaran, pengiriman, ulasan
- **Auto-Update:** Schema migration saat startup

---

## ✨ Fitur Utama

### ✅ Sudah Selesai

**Authentication & Authorization:**
- [x] Registrasi multi-role (pembeli, penjual, kurir, admin)
- [x] Login dengan JWT
- [x] Role-based access control (RBAC)
- [x] Upload avatar user

**Produk:**
- [x] Katalog produk publik
- [x] Detail produk dinamis
- [x] Upload foto produk (base64)
- [x] Kategori & satuan produk
- [x] Filter & search produk
- [x] Grid/Table view

**Transaksi:**
- [x] Keranjang belanja
- [x] Checkout dengan transaksi DB
- [x] Multiple metode pembayaran
- [x] Konfirmasi pembayaran manual
- [x] Upload bukti transfer

**Pengiriman:**
- [x] Tracking pesanan
- [x] Update status pengiriman
- [x] Nomor resi
- [x] Kurir hanya lihat alamat (privasi)

**Dashboard:**
- [x] Dashboard per role (pembeli, penjual, kurir, admin)
- [x] Statistik real-time
- [x] Kelola produk (penjual)
- [x] Kelola pesanan
- [x] Laporan transaksi (admin)
- [x] Moderasi ulasan (admin)

### 🚧 Coming Soon

- [ ] Real-time notification
- [ ] Chat pembeli-penjual
- [ ] Rating & review produk
- [ ] Export laporan (PDF/Excel)
- [ ] Analytics dashboard
- [ ] Multi-language support

---

## 👥 Role & Permission

### 🛒 Pembeli
**Akses:**
- ✅ Lihat katalog produk
- ✅ Tambah ke keranjang
- ✅ Checkout & bayar
- ✅ Tracking pesanan sendiri
- ✅ Batalkan pesanan (status: menunggu)
- ✅ Upload bukti transfer

**Dashboard:** `dashboard-pembeli.html`

### 🐟 Penjual/Nelayan
**Akses:**
- ✅ Kelola produk sendiri (CRUD)
- ✅ Upload foto produk
- ✅ Update stok & harga
- ✅ Lihat pesanan yang berisi produk sendiri
- ✅ Statistik penjualan
- ❌ Tidak bisa lihat alamat pembeli

**Dashboard:** `dashboard-penjual.html`

**Fitur Khusus:**
- Form lengkap: kategori, satuan, status
- Preview foto real-time
- Filter & search produk
- Toggle grid/table view
- Statistik: Total Produk, Produk Aktif, Pesanan Masuk

### 🚚 Kurir
**Akses (TERBATAS):**
- ✅ Lihat daftar pengiriman
- ✅ Lihat HANYA alamat tujuan
- ✅ Update status pengiriman
- ✅ Input nomor resi
- ❌ TIDAK bisa lihat: detail produk, harga, nama pembeli

**Dashboard:** `dashboard-kurir.html`

**Privasi:**
```javascript
// Query khusus kurir (TANPA detail produk/harga)
SELECT g.pengiriman_id, g.pesanan_id, p.alamat_kirim, g.no_resi, g.status_kirim
FROM pengiriman g
JOIN pesanan p ON p.pesanan_id = g.pesanan_id
WHERE g.kurir_id = ?
-- TIDAK ada JOIN ke produk atau pesanan_item!
```

### 👑 Admin
**Akses (FULL):**
- ✅ Kelola semua user (edit, verify, change role)
- ✅ Kelola semua produk (moderasi)
- ✅ Kelola semua pesanan
- ✅ Laporan transaksi (filter, export CSV)
- ✅ Moderasi ulasan (tampilkan/sembunyikan)
- ✅ Audit log

**Dashboard:** `admin.html`

---

## 📦 Setup & Instalasi

### 1. Database Setup

**Start XAMPP:**
- Jalankan MySQL di XAMPP Control Panel

**Import Database:**
```bash
# Via command line
mysql -u root toko_online < toko_online.sql

# Atau via phpMyAdmin:
# 1. Buka http://localhost/phpmyadmin
# 2. Buat database: toko_online
# 3. Import file: toko_online.sql
```

### 2. Backend Setup

**Install Dependencies:**
```bash
cd backend
npm install
```

**Konfigurasi Environment:**
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=toko_online
JWT_SECRET=your_jwt_secret_key_here
ADMIN_SECRET_KEY=LAUTAN_KITA_ADMIN_2025
```

**Start Backend:**
```bash
npm start
```

Expected output:
```
Server listening on 4000
Database connected
Added produk.kategori column
Added produk.satuan column
Updated user.role enum to include kurir
```

### 3. Frontend Setup

**Via Live Server (VS Code):**
1. Install extension: "Live Server"
2. Right-click `home_final.html`
3. Pilih "Open with Live Server"

**Atau buka langsung:**
```
http://localhost:3000/home_final.html
```

---

## 🔐 Membuat Akun Admin

### Cara 1: Via Script (RECOMMENDED)

```bash
node backend/create-admin.js
```

Output:
```
✅ Akun admin berhasil dibuat!

Email    : admin@lautankita.com
Password : Admin123456
```

### Cara 2: Via Web

1. Buka: `http://localhost:3000/registrasi-admin.html`
2. Isi form dengan secret key: `LAUTAN_KITA_ADMIN_2025`
3. Klik "Buat Akun Admin"

### Cara 3: Force Create (Reset Admin)

```bash
node backend/create-admin-force.js
```

Ini akan hapus admin lama dan buat baru.

### Verifikasi Admin

```bash
node backend/check-admin.js
```

Output:
```
✅ Ditemukan 1 admin:
  Email: admin@lautankita.com
  Password COCOK: "Admin123456"
```

---

## 📊 Dashboard System

### Router Otomatis (`dashboard.html`)

File router yang otomatis redirect ke dashboard sesuai role:

```javascript
// Cek token → Get user → Redirect
pembeli → dashboard-pembeli.html
penjual → dashboard-penjual.html
kurir   → dashboard-kurir.html
admin   → admin.html
```

### Dashboard Pembeli

**Fitur:**
- Statistik: Menunggu, Diproses, Dikirim, Selesai
- Tab filter pesanan
- Lihat detail pesanan
- Batalkan pesanan (status: menunggu)
- Tracking status

**API:**
- `GET /orders` - List pesanan
- `POST /orders/:id/cancel` - Batalkan

### Dashboard Penjual

**Fitur:**
- Statistik: Total Produk, Produk Aktif, Pesanan Masuk, Rating
- Kelola produk: Tambah, Edit, Hapus
- Form lengkap: kategori, satuan, status, foto
- Preview foto real-time
- Filter & search produk
- Toggle grid/table view
- Lihat pesanan masuk

**API:**
- `GET /penjual/produk` - List produk
- `POST /penjual/produk` - Tambah produk
- `PATCH /penjual/produk/:id` - Update produk
- `GET /penjual/orders` - Pesanan masuk

### Dashboard Kurir

**Fitur:**
- Statistik: Menunggu Pickup, Dalam Pengiriman, Terkirim
- Lihat HANYA alamat tujuan
- Update status pengiriman
- Input nomor resi
- TIDAK ada detail produk/harga/nama pembeli

**API:**
- `GET /kurir/shipments` - List pengiriman (TANPA detail produk)
- `PATCH /shipments/:id/status` - Update status

---

## 👑 Admin Panel

### Fitur Lengkap

**1. Dashboard**
- Statistik: Total Users, Products, Orders, Reviews
- Overview sistem

**2. Kelola Pengguna**
- List semua user
- Edit user: nama, email, role, verified
- Filter by role
- Search by nama/email

**3. Kelola Produk**
- List semua produk
- Moderasi status (aktif/nonaktif)
- Lihat detail produk

**4. Kelola Pesanan**
- List semua transaksi
- Update status pesanan
- Monitor pembayaran

**5. Laporan Transaksi** ⭐ NEW
- List semua transaksi pembayaran
- Filter by tanggal (dari - sampai)
- Filter by status (pending/confirmed/failed)
- Export ke CSV
- Ringkasan: Total, Berhasil, Pending, Gagal

**6. Moderasi Ulasan** ⭐ NEW
- List semua ulasan
- Filter by status (aktif/disembunyikan)
- Filter by rating (1-5 bintang)
- Tampilkan/sembunyikan ulasan
- Lihat detail ulasan

### Cara Menggunakan

**Edit User:**
1. Klik "Kelola Pengguna"
2. Klik "Edit" pada user
3. Ubah nama, email, role, atau verified
4. Klik "Simpan"

**Laporan Transaksi:**
1. Klik "Laporan Transaksi"
2. Pilih filter tanggal dan status
3. Klik "Filter"
4. Klik "Export CSV" untuk download

**Moderasi Ulasan:**
1. Klik "Moderasi Ulasan"
2. Pilih filter status dan rating
3. Klik "Tampilkan" atau "Sembunyikan"
4. Klik "Detail" untuk info lengkap

---

## 🔌 API Endpoints

### Authentication
```
POST   /auth/register          - Registrasi user
POST   /auth/login             - Login (return JWT)
GET    /auth/me                - Get user info
PATCH  /auth/me                - Update profile
POST   /auth/avatar            - Upload avatar
```

### Products
```
GET    /products               - List produk publik
POST   /penjual/produk         - Tambah produk (penjual)
GET    /penjual/produk         - List produk sendiri
PATCH  /penjual/produk/:id     - Update produk
```

### Cart
```
GET    /carts                  - List keranjang
POST   /carts/items            - Tambah item
PATCH  /carts/items/:id        - Update jumlah
DELETE /carts/items/:id        - Hapus item
```

### Orders
```
POST   /orders/checkout        - Checkout keranjang
GET    /orders                 - List pesanan
GET    /orders/:id             - Detail pesanan
POST   /orders/:id/cancel      - Batalkan pesanan
GET    /penjual/orders         - Pesanan masuk (penjual)
```

### Payments
```
POST   /payments               - Buat pembayaran
POST   /payments/:id/confirm   - Konfirmasi pembayaran
GET    /orders/:id/payments    - List pembayaran pesanan
```

### Shipments
```
POST   /shipments              - Buat pengiriman
PATCH  /shipments/:id/status   - Update status
GET    /kurir/shipments        - List pengiriman (kurir)
```

### Admin
```
GET    /admin/users            - List users
PATCH  /admin/users/:id        - Edit user
PATCH  /admin/users/:id/role   - Change role
PATCH  /admin/users/:id/verify - Verify user
GET    /admin/transactions     - List transaksi
GET    /admin/reviews          - List ulasan
PATCH  /admin/reviews/:id/status - Update status ulasan
PATCH  /admin/products/:id/status - Update status produk
PATCH  /admin/orders/:id/status - Update status pesanan
```

---

## 🐛 Troubleshooting

### Backend tidak bisa start

**Error:** Port 4000 sudah digunakan

**Solusi:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Atau ubah port di backend/src/app.js
```

### Database connection error

**Solusi:**
1. Pastikan XAMPP MySQL running
2. Cek kredensial di `backend/.env`
3. Import `toko_online.sql` jika belum
4. Test koneksi:
   ```bash
   node backend/check-admin.js
   ```

### Login gagal

**Solusi:**
1. Cek email dan password (case-sensitive)
2. Cek token di localStorage (F12 → Application)
3. Cek response di Network tab (F12 → Network)
4. Pastikan backend running di port 4000

### Role kurir tidak bisa register

**Solusi:**
```bash
# Auto-fix: Restart backend
npm start

# Manual fix:
mysql -u root toko_online < backend/update-schema-kurir.sql
```

### Admin tidak bisa login

**Solusi:**
```bash
# Cek admin
node backend/check-admin.js

# Buat admin baru
node backend/create-admin-force.js
```

### Foto tidak muncul

**Solusi:**
1. Pastikan folder `backend/uploads/` ada
2. Cek permission folder
3. Cek path foto di database
4. Restart backend

### CORS error

**Solusi:**
1. Backend sudah enable CORS
2. Akses via `http://localhost` atau `http://127.0.0.1`
3. Jangan gunakan `file://`

---

## 📁 Struktur Folder

```
lautan-kita/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth middleware
│   │   ├── db.js           # Database connection
│   │   └── app.js          # Express app
│   ├── uploads/            # Upload files
│   ├── .env                # Environment config
│   └── package.json
├── assets/
│   └── js/
│       └── api.js          # API helper
├── img/                    # Images
├── views/                  # Additional pages
├── docs/                   # Documentation
├── archive/                # Old files
│   ├── design-mockups/     # Design files
│   └── reference-files/    # Reference PHP files
├── home_final.html         # Homepage
├── login.html              # Login page
├── registrasi.html         # Registration
├── dashboard.html          # Dashboard router
├── dashboard-pembeli.html  # Buyer dashboard
├── dashboard-penjual.html  # Seller dashboard
├── dashboard-kurir.html    # Courier dashboard
├── admin.html              # Admin panel
├── detail-produk.html      # Product detail
├── keranjang.html          # Cart
├── checkout.html           # Checkout
└── toko_online.sql         # Database schema
```

---

## 🎯 Testing Checklist

### Authentication
- [ ] Register pembeli
- [ ] Register penjual
- [ ] Register kurir
- [ ] Login semua role
- [ ] Logout
- [ ] Upload avatar

### Pembeli Flow
- [ ] Lihat katalog produk
- [ ] Tambah ke keranjang
- [ ] Checkout
- [ ] Upload bukti transfer
- [ ] Tracking pesanan
- [ ] Batalkan pesanan

### Penjual Flow
- [ ] Tambah produk dengan foto
- [ ] Edit produk
- [ ] Update stok
- [ ] Lihat pesanan masuk
- [ ] Filter produk
- [ ] Toggle grid/table view

### Kurir Flow
- [ ] Lihat daftar pengiriman
- [ ] Verifikasi HANYA ada alamat
- [ ] Update status pengiriman
- [ ] Input nomor resi

### Admin Flow
- [ ] Edit user
- [ ] Change role user
- [ ] Verify user
- [ ] Lihat laporan transaksi
- [ ] Filter transaksi
- [ ] Export CSV
- [ ] Moderasi ulasan
- [ ] Tampilkan/sembunyikan ulasan

---

## 📞 Support & Contact

Untuk pertanyaan, bug report, atau feature request:
1. Cek dokumentasi di folder `docs/`
2. Lihat console browser (F12)
3. Cek log backend di terminal
4. Hubungi tim development

---

## 📝 Changelog

### Version 1.0.0 (10 Desember 2025)

**Added:**
- ✅ Dashboard role-based (pembeli, penjual, kurir, admin)
- ✅ Dashboard penjual enhanced (kategori, satuan, preview foto)
- ✅ Admin panel: Edit user, Laporan transaksi, Moderasi ulasan
- ✅ Kurir privacy: Hanya lihat alamat tujuan
- ✅ Auto-update database schema
- ✅ Upload foto produk & avatar
- ✅ Filter & search produk
- ✅ Export transaksi ke CSV

**Fixed:**
- ✅ Role kurir tidak bisa register
- ✅ Admin tidak bisa login
- ✅ Password hash validation

**Documentation:**
- ✅ Complete documentation
- ✅ Quick start guide
- ✅ API endpoints reference
- ✅ Troubleshooting guide

---

## 🎓 Credits

**Development Team:** Lautan Kita  
**Technology Stack:** Node.js, Express, MySQL, JWT, bcrypt  
**Design Reference:** Nelayan_Dashbord.php  
**Last Updated:** 10 Desember 2025

---

**Happy Coding! 🚀**

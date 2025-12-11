# Admin Panel - Fitur Lengkap

## 🎯 Fitur yang Tersedia

### 1. Dashboard
- Statistik total users, products, orders, reviews
- Overview sistem secara keseluruhan

### 2. Kelola Pengguna ✅
**Fitur:**
- Lihat semua user (pembeli, penjual, kurir, admin)
- **Edit user**: Nama, email, role, status verified
- Filter by role
- Search by nama/email

**Cara Menggunakan:**
1. Klik "Kelola Pengguna" di sidebar
2. Klik tombol "Edit" pada user yang ingin diubah
3. Ubah data: nama, email, role, atau centang verified
4. Klik "Simpan"

**API Endpoint:**
- `GET /admin/users` - List semua user
- `PATCH /admin/users/:id` - Edit user

### 3. Kelola Produk
**Fitur:**
- Lihat semua produk dari semua penjual
- Moderasi status produk (aktif/nonaktif)
- Lihat detail produk

**API Endpoint:**
- `GET /products` - List semua produk
- `PATCH /admin/products/:id/status` - Update status produk

### 4. Kelola Pesanan
**Fitur:**
- Lihat semua transaksi pesanan
- Monitor status pesanan
- Update status pesanan

**API Endpoint:**
- `GET /orders` - List semua pesanan (coming soon)
- `PATCH /admin/orders/:id/status` - Update status pesanan

### 5. Laporan Transaksi ✅ NEW!
**Fitur:**
- Lihat semua transaksi pembayaran
- Filter by tanggal (dari - sampai)
- Filter by status (pending, confirmed, failed)
- Export ke CSV
- Ringkasan: Total transaksi, berhasil, pending, gagal

**Cara Menggunakan:**
1. Klik "Laporan Transaksi" di sidebar
2. Pilih filter tanggal dan status
3. Klik "Filter" untuk apply
4. Klik "Export CSV" untuk download data
5. Klik "Detail" untuk lihat detail transaksi

**API Endpoint:**
- `GET /admin/transactions` - List semua transaksi pembayaran

**Data yang Ditampilkan:**
- ID Transaksi
- ID Pesanan
- Nama Pembeli
- Total Pembayaran
- Metode Pembayaran
- Status (pending/confirmed/failed)
- Tanggal Pembayaran
- Bukti Transfer (jika ada)

### 6. Moderasi Ulasan ✅ NEW!
**Fitur:**
- Lihat semua ulasan produk
- Filter by status (aktif/disembunyikan)
- Filter by rating (1-5 bintang)
- Tampilkan/sembunyikan ulasan
- Lihat detail ulasan lengkap

**Cara Menggunakan:**
1. Klik "Moderasi Ulasan" di sidebar
2. Pilih filter status dan rating
3. Klik "Tampilkan" untuk approve ulasan
4. Klik "Sembunyikan" untuk hide ulasan
5. Klik "Detail" untuk lihat info lengkap

**API Endpoint:**
- `GET /admin/reviews` - List semua ulasan
- `PATCH /admin/reviews/:id/status` - Update status ulasan

**Data yang Ditampilkan:**
- Nama Pembeli
- Nama Produk
- Rating (1-5 bintang)
- Komentar
- Status (aktif/disembunyikan)
- Tanggal Ulasan

## 🔐 Akses Admin Panel

### Login
```
Email    : admin@lautankita.com
Password : Admin123456
```

### Cara Akses
1. Login di `login.html`
2. Klik icon profil → "Dashboard"
3. Atau buka langsung `admin.html`

## 📊 API Endpoints Summary

### User Management
```
GET    /admin/users              - List users
PATCH  /admin/users/:id          - Edit user (NEW!)
PATCH  /admin/users/:id/role     - Change role
PATCH  /admin/users/:id/verify   - Change verified status
```

### Product Management
```
GET    /products                 - List products
PATCH  /admin/products/:id/status - Update status
```

### Transaction Reports
```
GET    /admin/transactions       - List transactions (NEW!)
  Query params:
  - status: pending|confirmed|failed
  - from: ISO date
  - to: ISO date
```

### Review Moderation
```
GET    /admin/reviews            - List reviews (NEW!)
  Query params:
  - status: aktif|disembunyikan
  - rating: 1-5

PATCH  /admin/reviews/:id/status - Update status (NEW!)
  Body: { status: "aktif" | "disembunyikan" }
```

## 🎨 UI Components

### Modal Edit User
- Input: Nama, Email
- Select: Role (pembeli/penjual/kurir/admin)
- Checkbox: Verified
- Buttons: Batal, Simpan

### Filter Transaksi
- Date picker: Dari Tanggal, Sampai Tanggal
- Select: Status Pembayaran
- Button: Filter, Export CSV

### Review Card
- Avatar pembeli
- Rating bintang
- Nama produk
- Komentar
- Status badge
- Actions: Tampilkan/Sembunyikan, Detail

## 🚀 Testing

### Test Edit User
```bash
# 1. Login sebagai admin
# 2. Buka "Kelola Pengguna"
# 3. Klik "Edit" pada user
# 4. Ubah nama menjadi "Test User Updated"
# 5. Ubah role menjadi "penjual"
# 6. Centang "Verified"
# 7. Klik "Simpan"
# Expected: Modal "Berhasil", data ter-update
```

### Test Laporan Transaksi
```bash
# 1. Login sebagai admin
# 2. Klik "Laporan Transaksi"
# 3. Pilih tanggal dari: 2025-01-01
# 4. Pilih tanggal sampai: 2025-12-31
# 5. Pilih status: confirmed
# 6. Klik "Filter"
# Expected: Tabel menampilkan transaksi confirmed
# 7. Klik "Export CSV"
# Expected: File CSV ter-download
```

### Test Moderasi Ulasan
```bash
# 1. Login sebagai admin
# 2. Klik "Moderasi Ulasan"
# 3. Pilih status: aktif
# 4. Pilih rating: 5
# Expected: Hanya ulasan 5 bintang yang aktif
# 5. Klik "Sembunyikan" pada ulasan
# Expected: Modal "Berhasil", ulasan status berubah
# 6. Klik "Detail"
# Expected: Modal detail ulasan muncul
```

## 📝 Database Schema

### Tabel yang Digunakan

**user**
- user_id, nama, email, role, verified

**produk**
- produk_id, nama_produk, harga, stok, status

**pembayaran**
- pembayaran_id, pesanan_id, jumlah_bayar, metode_pembayaran, status_pembayaran, tanggal_pembayaran

**ulasan**
- ulasan_id, produk_id, pembeli_id, rating, komentar, status (aktif/disembunyikan), dibuat_pada

**audit_log**
- Mencatat semua aksi admin

## ⚠️ Troubleshooting

### Error: "Failed to load transactions"
**Solusi:**
- Pastikan backend running
- Cek token auth valid
- Pastikan tabel `pembayaran` ada di database

### Error: "Failed to load reviews"
**Solusi:**
- Pastikan tabel `ulasan` ada
- Cek kolom `status` di tabel ulasan (enum: aktif, disembunyikan)
- Cek kolom `dibuat_pada` ada

### Error: "email_exists" saat edit user
**Solusi:**
- Email sudah digunakan user lain
- Gunakan email yang berbeda

### Export CSV tidak berfungsi
**Solusi:**
- Pastikan ada data transaksi
- Cek browser allow download
- Cek console untuk error

## 🔄 Update Log

**2025-12-10:**
- ✅ Tambah fitur Edit User
- ✅ Tambah Laporan Transaksi dengan filter dan export
- ✅ Tambah Moderasi Ulasan dengan filter
- ✅ Update backend API endpoints
- ✅ Update UI dengan modal dan filter

## 📚 File yang Dimodifikasi

1. `admin.html` - UI dan JavaScript
2. `backend/src/routes/admin.js` - API endpoints
3. `ADMIN-PANEL-FEATURES.md` - Dokumentasi ini

## 🎯 Next Steps (Opsional)

- [ ] Bulk actions untuk user (delete multiple)
- [ ] Advanced analytics dashboard
- [ ] Email notification untuk admin
- [ ] Activity log viewer
- [ ] User suspension feature
- [ ] Product approval workflow
- [ ] Review response feature (admin reply to reviews)

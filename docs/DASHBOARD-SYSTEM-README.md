# Sistem Dashboard Role-Based - Lautan Kita

## 📋 Overview

Sistem dashboard yang terpisah untuk setiap role dengan permission yang jelas dan terbatas sesuai kebutuhan masing-masing pengguna.

## 🎯 File Dashboard

### 1. **dashboard.html** (Router Otomatis)
File router yang otomatis mengarahkan user ke dashboard sesuai role mereka.

**Cara Kerja:**
- Cek token login
- Ambil data user dari `/auth/me`
- Redirect ke dashboard sesuai role:
  - `pembeli` → `dashboard-pembeli.html`
  - `penjual` → `dashboard-penjual.html`
  - `kurir` → `dashboard-kurir.html`
  - `admin` → `admin.html`

**Akses:**
- Dari menu profil di beranda (tombol "Dashboard")
- Direct URL: `dashboard.html`

---

### 2. **dashboard-pembeli.html** (Dashboard Pembeli)

**Permission:**
✅ Lihat semua pesanan sendiri
✅ Lihat detail pesanan (produk, harga, total)
✅ Batalkan pesanan (status: menunggu)
✅ Tracking status pesanan
✅ Lihat statistik pesanan

**Fitur:**
- **Statistik Cards:**
  - Menunggu Pembayaran
  - Sedang Diproses
  - Dalam Pengiriman
  - Pesanan Selesai

- **Tab Filter:**
  - Semua Pesanan
  - Menunggu
  - Diproses
  - Dikirim
  - Selesai

- **Aksi:**
  - Lihat Detail Pesanan
  - Batalkan Pesanan (hanya status menunggu)

**API Endpoints:**
```javascript
GET /auth/me              // Info user
GET /orders               // List pesanan
POST /orders/:id/cancel   // Batalkan pesanan
```

---

### 3. **dashboard-penjual.html** (Dashboard Penjual)

**Permission:**
✅ Kelola produk sendiri (CRUD)
✅ Lihat pesanan yang berisi produk sendiri
✅ Upload foto produk
✅ Update stok dan harga
✅ Lihat statistik penjualan

**Fitur:**
- **Statistik Cards:**
  - Total Produk
  - Pesanan Masuk
  - Total Pendapatan
  - Rating Toko

- **Tab:**
  - Produk Saya
  - Pesanan Masuk

- **Kelola Produk:**
  - Tambah produk baru (dengan foto)
  - Edit produk (nama, deskripsi, harga, stok)
  - Hapus produk (coming soon)
  - Lihat status produk (aktif/nonaktif)

- **Pesanan Masuk:**
  - Lihat pesanan yang berisi produk penjual
  - Detail: nama produk, jumlah, subtotal
  - Tidak bisa lihat alamat pembeli (privasi)

**API Endpoints:**
```javascript
GET /auth/me                      // Info user
GET /penjual/produk               // List produk sendiri
POST /penjual/produk              // Tambah produk
PATCH /penjual/produk/:id         // Update produk
GET /penjual/orders               // Pesanan masuk
```

---

### 4. **dashboard-kurir.html** (Dashboard Kurir)

**Permission (TERBATAS):**
✅ Lihat daftar pengiriman yang ditugaskan
✅ Lihat HANYA alamat tujuan
✅ Update status pengiriman
✅ Input/update nomor resi

❌ TIDAK bisa lihat:
- Detail produk
- Harga produk
- Nama pembeli
- Informasi pembayaran

**Fitur:**
- **Alert Privasi:**
  ```
  "Sebagai kurir, Anda hanya dapat melihat informasi pengiriman 
  (alamat tujuan dan nomor resi). Detail produk dan harga tidak 
  ditampilkan untuk menjaga privasi pelanggan."
  ```

- **Statistik Cards:**
  - Menunggu Pickup
  - Dalam Pengiriman
  - Terkirim Hari Ini
  - Total Pengiriman

- **Tab Filter:**
  - Menunggu Pickup
  - Dalam Pengiriman
  - Terkirim

- **Info Pengiriman (Yang Ditampilkan):**
  - ID Pengiriman
  - ID Pesanan
  - Alamat Tujuan (HANYA INI)
  - Nomor Resi
  - Status Pengiriman
  - Tanggal

- **Aksi:**
  - Update Status (diproses → dikirim → diterima)
  - Input Nomor Resi
  - Tandai Terkirim (quick action)

**API Endpoints:**
```javascript
GET /auth/me                      // Info user
GET /kurir/shipments              // List pengiriman (TANPA detail produk/harga)
PATCH /shipments/:id/status       // Update status & resi
```

**Backend Query (Khusus Kurir):**
```sql
SELECT 
  g.peneriman_id AS pengiriman_id,
  g.pesanan_id,
  p.alamat_kirim,           -- HANYA alamat
  g.no_resi,
  g.status_kirim,
  g.updated_at
FROM pengiriman g
JOIN pesanan p ON p.pesanan_id = g.pesanan_id
WHERE g.kurir_id = ? OR g.kurir_id IS NULL
-- TIDAK JOIN ke produk atau harga!
```

---

### 5. **admin.html** (Dashboard Admin)

**Permission (FULL ACCESS):**
✅ Kelola semua user
✅ Ubah role user
✅ Verifikasi user
✅ Moderasi ulasan
✅ Kelola status pesanan
✅ Lihat semua data

**Fitur:**
- **Tab:**
  - Pengguna
  - Ulasan

- **Kelola User:**
  - Cari user (nama/email)
  - Filter by role
  - Ubah role user
  - Verify/Unverify user

- **Kelola Ulasan:**
  - Cari ulasan
  - Filter by status
  - Aktifkan/Sembunyikan ulasan

**API Endpoints:**
```javascript
GET /admin/users                  // List semua user
PATCH /admin/users/:id/role       // Ubah role
PATCH /admin/users/:id/verify     // Verify user
GET /admin/reviews                // List ulasan
PATCH /admin/reviews/:id/status   // Update status ulasan
PATCH /admin/orders/:id/status    // Update status pesanan
```

---

## 🔐 Permission Matrix

| Fitur | Pembeli | Penjual | Kurir | Admin |
|-------|---------|---------|-------|-------|
| Lihat pesanan sendiri | ✅ | ✅ (produknya) | ❌ | ✅ (semua) |
| Lihat detail produk | ✅ | ✅ (miliknya) | ❌ | ✅ |
| Lihat harga | ✅ | ✅ | ❌ | ✅ |
| Lihat alamat pembeli | ✅ (sendiri) | ❌ | ✅ (tujuan) | ✅ |
| Kelola produk | ❌ | ✅ (miliknya) | ❌ | ✅ |
| Update status pengiriman | ❌ | ❌ | ✅ | ✅ |
| Kelola user | ❌ | ❌ | ❌ | ✅ |
| Batalkan pesanan | ✅ (sendiri) | ❌ | ❌ | ✅ |

---

## 🚀 Cara Menggunakan

### Untuk Pembeli:
1. Login sebagai pembeli
2. Klik menu profil → "Dashboard"
3. Lihat pesanan, tracking, batalkan jika perlu

### Untuk Penjual:
1. Login sebagai penjual
2. Klik menu profil → "Dashboard"
3. Kelola produk: tambah, edit, update stok
4. Lihat pesanan masuk yang berisi produk Anda

### Untuk Kurir:
1. Login sebagai kurir
2. Klik menu profil → "Dashboard"
3. Lihat daftar pengiriman (HANYA alamat)
4. Update status: pickup → kirim → terkirim
5. Input nomor resi

### Untuk Admin:
1. Login sebagai admin
2. Klik menu profil → "Dashboard"
3. Kelola user, ulasan, pesanan
4. Full access ke semua data

---

## 🔒 Keamanan & Privasi

### Kurir - Pembatasan Akses:
```javascript
// ❌ TIDAK BOLEH AKSES:
- Detail produk (nama, jenis, jumlah)
- Harga produk
- Total pembayaran
- Nama pembeli
- Email pembeli
- Nomor telepon pembeli

// ✅ BOLEH AKSES:
- ID Pengiriman
- ID Pesanan (referensi saja)
- Alamat Tujuan (untuk pengiriman)
- Nomor Resi
- Status Pengiriman
```

### Backend Validation:
```javascript
// Middleware auth.js
requireRole(['kurir'])  // Hanya kurir yang bisa akses

// Query khusus kurir (tanpa join ke produk/harga)
SELECT g.peneriman_id, g.pesanan_id, p.alamat_kirim, g.no_resi, g.status_kirim
FROM pengiriman g
JOIN pesanan p ON p.pesanan_id = g.pesanan_id
WHERE g.kurir_id = ?
-- TIDAK ada JOIN ke produk atau pesanan_item!
```

---

## 📱 Responsive Design

Semua dashboard responsive dan mobile-friendly:
- Grid layout otomatis adjust
- Tab navigation touch-friendly
- Modal full-screen di mobile
- Font size scalable

---

## 🎨 Design System

### Warna:
- Primary: `#0077B6` (Biru)
- Background: `#d6d9ff` (Biru Muda)
- Success: `#10B981` (Hijau)
- Danger: `#EF4444` (Merah)
- Warning: `#F59E0B` (Kuning)

### Status Colors:
- Menunggu: `#FEF3C7` (Kuning)
- Diproses: `#DBEAFE` (Biru)
- Dikirim: `#FEF3C7` (Kuning)
- Selesai: `#D1FAE5` (Hijau)
- Dibatalkan: `#FEE2E2` (Merah)

---

## 🔧 Backend Requirements

### Endpoint Baru yang Ditambahkan:

**1. GET /kurir/shipments**
```javascript
// Khusus kurir - TANPA detail produk/harga
router.get('/kurir/shipments', requireAuth, requireRole(['kurir']), async (req, res) => {
  const [rows] = await conn.query(
    'SELECT g.peneriman_id, g.pesanan_id, p.alamat_kirim, g.no_resi, g.status_kirim, g.updated_at ' +
    'FROM pengiriman g JOIN pesanan p ON p.pesanan_id = g.pesanan_id ' +
    'WHERE g.kurir_id=? OR g.kurir_id IS NULL',
    [req.user.id]
  );
  res.json(rows);
});
```

**2. GET /shipments**
```javascript
// Admin/Penjual - dengan detail lengkap
router.get('/shipments', requireAuth, requireRole(['admin','penjual']), async (req, res) => {
  const [rows] = await conn.query(
    'SELECT g.*, p.alamat_kirim, u.nama AS kurir_nama ' +
    'FROM pengiriman g ' +
    'LEFT JOIN user u ON u.user_id=g.kurir_id ' +
    'JOIN pesanan p ON p.pesanan_id=g.pesanan_id'
  );
  res.json(rows);
});
```

---

## 📊 Testing

### Test Scenario:

**1. Test Role Pembeli:**
```
- Login sebagai pembeli
- Akses dashboard.html → redirect ke dashboard-pembeli.html
- Lihat pesanan
- Batalkan pesanan (status menunggu)
- Coba akses dashboard-penjual.html → ditolak
```

**2. Test Role Penjual:**
```
- Login sebagai penjual
- Akses dashboard.html → redirect ke dashboard-penjual.html
- Tambah produk dengan foto
- Edit stok produk
- Lihat pesanan masuk
- Coba akses dashboard-pembeli.html → ditolak
```

**3. Test Role Kurir:**
```
- Login sebagai kurir
- Akses dashboard.html → redirect ke dashboard-kurir.html
- Verifikasi TIDAK ada detail produk/harga
- Verifikasi HANYA ada alamat tujuan
- Update status pengiriman
- Input nomor resi
- Coba akses dashboard-pembeli.html → ditolak
```

**4. Test Role Admin:**
```
- Login sebagai admin
- Akses dashboard.html → redirect ke admin.html
- Kelola user (ubah role, verify)
- Kelola ulasan
- Full access ke semua data
```

---

## 🐛 Troubleshooting

### Dashboard tidak muncul:
- Cek token login di localStorage
- Cek role user di `/auth/me`
- Cek console browser untuk error

### Kurir bisa lihat detail produk:
- ❌ BUG! Backend query salah
- Pastikan query TIDAK JOIN ke tabel produk/pesanan_item
- Hanya ambil dari tabel pengiriman + pesanan (alamat saja)

### Redirect loop:
- Cek role user valid
- Pastikan file dashboard sesuai role ada
- Clear cache browser

---

## 🚀 Future Enhancements

- [ ] Real-time notification untuk pesanan baru
- [ ] Chat antara pembeli-penjual
- [ ] Rating & review untuk kurir
- [ ] Export laporan (PDF/Excel)
- [ ] Dashboard analytics dengan chart
- [ ] Multi-language support
- [ ] Dark mode

---

## 📞 Support

Untuk pertanyaan atau bug report terkait sistem dashboard, hubungi tim development Lautan Kita.

---

**Last Updated:** 2025-12-09
**Version:** 1.0.0

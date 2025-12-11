# Testing Admin Panel - Quick Guide

## Prerequisites
- Backend running di port 4000
- Database `toko_online` sudah ada
- Akun admin sudah dibuat

## Step 1: Login sebagai Admin

```
Email    : admin@lautankita.com
Password : Admin123456
```

1. Buka `login.html`
2. Masukkan kredensial admin
3. Klik "Masuk"
4. Klik icon profil → "Dashboard"

## Step 2: Test Edit User

### Scenario: Edit nama dan role user

1. Klik "Kelola Pengguna" di sidebar
2. Lihat daftar user
3. Klik tombol "Edit" pada user pertama
4. Modal "Edit Pengguna" muncul
5. Ubah nama menjadi: "Test User Updated"
6. Ubah role menjadi: "penjual"
7. Centang checkbox "Verified"
8. Klik "Simpan"

**Expected Result:**
- Modal "Berhasil" muncul
- Tabel user ter-refresh
- Data user berubah sesuai input

**API Call:**
```
PATCH /admin/users/:id
Body: {
  "nama": "Test User Updated",
  "role": "penjual",
  "verified": true
}
```

## Step 3: Test Laporan Transaksi

### Scenario: Lihat dan filter transaksi

1. Klik "Laporan Transaksi" di sidebar
2. Lihat tabel transaksi (jika ada data)
3. Pilih "Dari Tanggal": 2025-01-01
4. Pilih "Sampai Tanggal": 2025-12-31
5. Pilih "Status": confirmed
6. Klik "Filter"

**Expected Result:**
- Tabel menampilkan transaksi yang confirmed
- Hanya transaksi dalam range tanggal yang dipilih
- Ringkasan statistik ter-update

**Data yang Ditampilkan:**
- ID Transaksi
- ID Pesanan
- Nama Pembeli
- Total Pembayaran
- Metode Pembayaran
- Status
- Tanggal

### Scenario: Export transaksi ke CSV

1. Setelah filter transaksi
2. Klik tombol "Export CSV"

**Expected Result:**
- File CSV ter-download
- Nama file: `transaksi_YYYY-MM-DD.csv`
- Isi file: semua transaksi yang terfilter

### Scenario: Lihat detail transaksi

1. Klik tombol "Detail" pada transaksi
2. Modal detail muncul

**Expected Result:**
- Modal menampilkan:
  - ID Pesanan
  - Nama Pembeli
  - Total Pembayaran
  - Metode Pembayaran
  - Status
  - Tanggal
  - Link bukti transfer (jika ada)

## Step 4: Test Moderasi Ulasan

### Scenario: Filter ulasan by status dan rating

1. Klik "Moderasi Ulasan" di sidebar
2. Pilih "Status": aktif
3. Pilih "Rating": 5 Bintang

**Expected Result:**
- Hanya ulasan 5 bintang yang aktif ditampilkan
- Review card menampilkan:
  - Avatar pembeli
  - Nama pembeli
  - Rating bintang
  - Nama produk
  - Komentar
  - Status badge
  - Tanggal ulasan

### Scenario: Sembunyikan ulasan

1. Lihat ulasan dengan status "Aktif"
2. Klik tombol "Sembunyikan"

**Expected Result:**
- Modal "Berhasil" muncul
- Ulasan status berubah menjadi "Disembunyikan"
- Badge berubah warna
- Tombol berubah menjadi "Tampilkan"

**API Call:**
```
PATCH /admin/reviews/:id/status
Body: {
  "status": "disembunyikan"
}
```

### Scenario: Tampilkan ulasan

1. Filter status: disembunyikan
2. Klik tombol "Tampilkan" pada ulasan

**Expected Result:**
- Modal "Berhasil" muncul
- Ulasan status berubah menjadi "Aktif"
- Badge berubah warna
- Tombol berubah menjadi "Sembunyikan"

### Scenario: Lihat detail ulasan

1. Klik tombol "Detail" pada ulasan
2. Modal detail muncul

**Expected Result:**
- Modal menampilkan:
  - Nama Pembeli
  - Nama Produk
  - Rating bintang
  - Status badge
  - Komentar lengkap
  - Tanggal ulasan

## Step 5: Test Kelola Produk

### Scenario: Lihat semua produk

1. Klik "Kelola Produk" di sidebar
2. Lihat daftar produk dari semua penjual

**Expected Result:**
- Tabel menampilkan:
  - ID Produk
  - Nama Produk
  - Nama Penjual
  - Harga
  - Stok
  - Status
  - Tombol Edit

## Troubleshooting

### Problem: "Failed to load transactions"
**Check:**
1. Backend running? `http://localhost:4000`
2. Token valid? Coba logout dan login lagi
3. Tabel `pembayaran` ada di database?
4. Ada data transaksi di database?

**Debug:**
```bash
# Cek backend logs
# Cek console browser (F12)
# Test API manual:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/admin/transactions
```

### Problem: "Failed to load reviews"
**Check:**
1. Tabel `ulasan` ada di database?
2. Kolom `status` ada? (enum: aktif, disembunyikan)
3. Kolom `dibuat_pada` ada?
4. Ada data ulasan di database?

**Fix:**
```sql
-- Cek struktur tabel
DESCRIBE ulasan;

-- Cek data
SELECT * FROM ulasan LIMIT 5;
```

### Problem: Modal edit user tidak muncul
**Check:**
1. JavaScript error di console?
2. Data user ter-load?
3. Tombol "Edit" ada onclick handler?

**Debug:**
```javascript
// Di console browser:
console.log(document.getElementById('editUserModal'));
```

### Problem: Export CSV tidak download
**Check:**
1. Ada data transaksi?
2. Browser allow download?
3. Pop-up blocker aktif?

**Fix:**
- Allow download di browser settings
- Disable pop-up blocker untuk localhost

## Sample Data untuk Testing

### Buat Transaksi Dummy (via SQL)
```sql
-- Insert dummy pembayaran
INSERT INTO pembayaran (pesanan_id, jumlah_bayar, metode_pembayaran, status_pembayaran, tanggal_pembayaran)
VALUES 
(1, 150000, 'transfer_bank', 'confirmed', '2025-12-01 10:00:00'),
(2, 250000, 'e-wallet', 'pending', '2025-12-05 14:30:00'),
(3, 100000, 'transfer_bank', 'failed', '2025-12-08 09:15:00');
```

### Buat Ulasan Dummy (via SQL)
```sql
-- Insert dummy ulasan
INSERT INTO ulasan (produk_id, pembeli_id, rating, komentar, status, dibuat_pada)
VALUES 
(1, 2, 5, 'Produk sangat bagus, fresh!', 'aktif', '2025-12-01 11:00:00'),
(2, 3, 4, 'Lumayan, tapi agak kecil', 'aktif', '2025-12-03 15:20:00'),
(1, 3, 3, 'Biasa saja', 'disembunyikan', '2025-12-05 08:45:00');
```

## API Testing dengan curl

### Test Get Transactions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/admin/transactions?status=confirmed"
```

### Test Edit User
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test Updated","role":"penjual","verified":true}' \
  "http://localhost:4000/admin/users/2"
```

### Test Get Reviews
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/admin/reviews?status=aktif&rating=5"
```

### Test Update Review Status
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"disembunyikan"}' \
  "http://localhost:4000/admin/reviews/1/status"
```

## Checklist Testing

- [ ] Login sebagai admin berhasil
- [ ] Dashboard menampilkan statistik
- [ ] Kelola Pengguna: Lihat list user
- [ ] Kelola Pengguna: Edit user berhasil
- [ ] Kelola Produk: Lihat list produk
- [ ] Laporan Transaksi: Lihat list transaksi
- [ ] Laporan Transaksi: Filter by tanggal
- [ ] Laporan Transaksi: Filter by status
- [ ] Laporan Transaksi: Export CSV
- [ ] Laporan Transaksi: Lihat detail
- [ ] Moderasi Ulasan: Lihat list ulasan
- [ ] Moderasi Ulasan: Filter by status
- [ ] Moderasi Ulasan: Filter by rating
- [ ] Moderasi Ulasan: Sembunyikan ulasan
- [ ] Moderasi Ulasan: Tampilkan ulasan
- [ ] Moderasi Ulasan: Lihat detail

## Success Criteria

✅ **Edit User:**
- Modal muncul dengan data user
- Update berhasil
- Data ter-refresh di tabel

✅ **Laporan Transaksi:**
- Tabel menampilkan transaksi
- Filter berfungsi
- Export CSV berhasil
- Detail transaksi muncul

✅ **Moderasi Ulasan:**
- Review cards ditampilkan
- Filter berfungsi
- Update status berhasil
- Detail ulasan muncul

Selamat testing! 🎉

# Testing Dashboard Penjual - Quick Guide

## Prerequisites
- XAMPP MySQL running
- Database `toko_online` sudah ada
- Backend sudah disetup

## Step 1: Start Backend
```bash
cd backend
npm start
```

**Expected Output:**
```
Server listening on 4000
Database connected
Added produk.kategori column
Added produk.satuan column
```

## Step 2: Buat Akun Penjual (jika belum ada)
1. Buka `registrasi.html`
2. Isi form:
   - Nama: Test Penjual
   - Email: penjual@test.com
   - Password: Test123456
   - Role: **Penjual**
3. Klik "Daftar"

## Step 3: Login sebagai Penjual
1. Buka `login.html`
2. Login dengan:
   - Email: penjual@test.com
   - Password: Test123456
3. Klik "Masuk"

## Step 4: Akses Dashboard Penjual
1. Setelah login, klik icon profil di kanan atas
2. Klik "Dashboard"
3. Anda akan diarahkan ke `dashboard-penjual.html`

## Step 5: Test Tambah Produk
1. Klik tombol "Tambah Produk" (hijau, kanan atas)
2. Isi form:
   - Nama: Ikan Tongkol Segar
   - Kategori: ikan
   - Deskripsi: Ikan tongkol segar hasil tangkapan pagi
   - Harga: 35000
   - Satuan: kg
   - Stok: 20
   - Status: aktif
3. Upload foto (opsional)
4. Lihat preview foto muncul
5. Klik "Simpan"

**Expected Result:**
- Modal "Berhasil" muncul
- Produk muncul di grid/tabel
- Statistik "Total Produk" bertambah
- Statistik "Produk Aktif" bertambah

## Step 6: Test Filter Produk
1. Tambah beberapa produk lagi
2. Ketik di search box: "tongkol"
3. Produk akan terfilter
4. Pilih status "Aktif" di dropdown
5. Hanya produk aktif yang muncul

## Step 7: Test Toggle View
1. Klik tombol "Tabel"
2. Produk ditampilkan dalam format tabel
3. Klik tombol "Grid"
4. Produk kembali ke format grid

## Step 8: Test Edit Produk
1. Klik tombol "Edit" pada salah satu produk
2. Form akan terisi dengan data produk
3. Ubah harga menjadi 40000
4. Upload foto baru
5. Klik "Simpan"

**Expected Result:**
- Modal "Berhasil" muncul
- Harga produk berubah
- Foto produk berubah (jika diupload)

## Troubleshooting

### Error: "Failed to load products"
- Pastikan backend running
- Cek console browser untuk error detail
- Pastikan token auth valid (coba logout dan login lagi)

### Foto tidak muncul
- Pastikan folder `backend/uploads/products` ada
- Cek permission folder
- Cek console untuk error upload

### Kolom kategori/satuan tidak ada
- Restart backend untuk trigger auto-update schema
- Atau jalankan manual: `mysql -u root toko_online < backend/update-schema-produk.sql`

## API Endpoints yang Digunakan

- `GET /auth/me` - Cek user login
- `GET /penjual/produk` - Load produk penjual
- `POST /penjual/produk` - Tambah produk baru
- `PATCH /penjual/produk/:id` - Update produk
- `GET /penjual/orders` - Load pesanan masuk

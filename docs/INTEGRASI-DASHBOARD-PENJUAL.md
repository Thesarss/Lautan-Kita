# Integrasi Dashboard Penjual dengan Fitur Nelayan

## Perubahan yang Dilakukan

### 1. Dashboard Penjual (`dashboard-penjual.html`)

**Fitur Baru yang Ditambahkan:**
- ✅ **Preview foto produk** saat upload (real-time preview)
- ✅ **Form lengkap** dengan kategori (ikan, udang, cumi, kerang, lainnya)
- ✅ **Satuan produk** (kg, ons, ikat, pcs)
- ✅ **Status produk** (aktif/nonaktif)
- ✅ **Toggle view** Grid/Tabel untuk tampilan produk
- ✅ **Filter dan search** produk berdasarkan nama dan status
- ✅ **Statistik produk aktif** di dashboard
- ✅ **Tabel produk** dengan thumbnail, kategori, dan info lengkap

**Fungsi JavaScript Baru:**
- `previewImage(event)` - Preview foto sebelum upload
- `setProductView(mode)` - Toggle antara grid dan tabel
- `filterProducts()` - Filter produk berdasarkan search dan status
- `renderProductsGrid()` - Render produk dalam grid view
- `renderProductsTable()` - Render produk dalam table view

### 2. Backend API (`backend/src/routes/products.js`)

**Endpoint yang Diupdate:**
- `POST /penjual/produk` - Sekarang support kategori, satuan, status
- `PATCH /penjual/produk/:id` - Support update foto, kategori, satuan
- `GET /penjual/produk` - Return kategori dan satuan

**Field Baru yang Didukung:**
- `kategori` (VARCHAR 50) - Kategori produk (ikan, udang, dll)
- `satuan` (VARCHAR 20) - Satuan produk (kg, ons, ikat, pcs)
- `status` (ENUM) - Status produk (aktif/nonaktif)
- `photo_url` (VARCHAR 255) - Path foto produk

### 3. Database Schema (`backend/src/app.js`)

**Auto-Update Schema saat Server Start:**

```javascript
// Kolom yang ditambahkan otomatis:
- produk.kategori (VARCHAR 50)
- produk.satuan (VARCHAR 20, default 'kg')
- produk.photo_url (VARCHAR 255)
```

## Cara Menggunakan

### 1. Start Backend
```bash
cd backend
npm start
```

Server akan otomatis menambahkan kolom baru ke database.

### 2. Login sebagai Penjual
- Buka `login.html`
- Login dengan akun penjual
- Klik "Dashboard" di menu profil

### 3. Tambah Produk Baru
1. Klik tombol "Tambah Produk"
2. Isi form:
   - Nama produk (wajib)
   - Kategori (opsional)
   - Deskripsi (opsional)
   - Harga per satuan (wajib)
   - Satuan (kg/ons/ikat/pcs)
   - Stok (wajib)
   - Status (aktif/nonaktif)
   - Upload foto (opsional)
3. Preview foto akan muncul otomatis
4. Klik "Simpan"

### 4. Edit Produk
1. Klik tombol "Edit" pada produk
2. Form akan terisi dengan data produk
3. Ubah data yang diperlukan
4. Upload foto baru jika perlu
5. Klik "Simpan"

### 5. Filter Produk
- Gunakan search box untuk cari produk
- Gunakan dropdown status untuk filter
- Toggle Grid/Tabel untuk ubah tampilan

## File yang Dimodifikasi

1. `dashboard-penjual.html` - UI dan fitur baru
2. `backend/src/routes/products.js` - API endpoint
3. `backend/src/app.js` - Auto-update schema
4. `backend/update-schema-produk.sql` - Manual schema update

## Referensi

Fitur ini diintegrasikan dari:
- `Nelayan_Dashbord.php` - Form dan UI design
- `simpan_produk.php` - Logic simpan produk

# Fitur Rating Penjual dan Hapus Produk - Summary

## 🎯 Fitur yang Diimplementasi

### 1. **Hapus Produk oleh Penjual**
- **Endpoint**: `DELETE /penjual/produk/:id`
- **Fitur**:
  - Penjual dapat menghapus produk miliknya
  - Validasi kepemilikan produk
  - Cek apakah produk sedang dalam pesanan aktif
  - Hapus file gambar produk otomatis
  - Rollback jika ada error

- **Frontend**: 
  - Tombol "Hapus" di dashboard penjual
  - Konfirmasi dialog sebelum menghapus
  - Refresh otomatis setelah berhasil

### 2. **Rating Penjual oleh Pembeli**
- **Database**: Tabel `rating_penjual` baru dengan kolom:
  - `rating_id`, `penjual_id`, `pembeli_id`, `pesanan_id`
  - `rating` (1-5), `komentar`, `status`, `dibuat_pada`
  - Unique constraint per pembeli-pesanan-penjual
  - Cache `avg_rating` dan `total_ratings` di tabel `user`

- **Backend Endpoints**:
  - `POST /ratings/seller` - Submit rating
  - `GET /ratings/seller/:id` - Get ratings untuk penjual
  - `GET /ratings/rateable-orders` - Get pesanan yang bisa dirating
  - `PATCH /ratings/seller/:ratingId` - Update rating
  - `PATCH /admin/ratings/:ratingId/status` - Admin hide/show rating

- **Frontend**:
  - Tab "Rating Penjual" di dashboard pembeli
  - Modal rating dengan bintang interaktif
  - List pesanan yang sudah selesai dan bisa dirating
  - Status "Sudah Dirating" untuk pesanan yang sudah dirating

## 🔧 File yang Dimodifikasi

### Backend:
1. **`backend/src/routes/products.js`**
   - Tambah endpoint `DELETE /penjual/produk/:id`

2. **`backend/src/routes/ratings.js`** (BARU)
   - Semua endpoint untuk rating penjual

3. **`backend/src/app.js`**
   - Register route ratings
   - Auto-create tabel `rating_penjual`
   - Auto-add kolom `avg_rating` dan `total_ratings`

4. **`backend/update-schema-seller-rating.sql`** (BARU)
   - SQL script untuk manual database update

### Frontend:
1. **`dashboard-penjual.html`**
   - Update fungsi `deleteProduct()` untuk call API
   - Konfirmasi dialog dan error handling

2. **`dashboard-pembeli.html`**
   - Tambah tab "Rating Penjual"
   - Modal rating dengan star rating
   - Fungsi load dan render rateable orders
   - Form submission untuk rating

## 🚀 Cara Menggunakan

### Untuk Penjual:
1. Login sebagai penjual
2. Buka Dashboard Penjual
3. Di tab "Produk Saya", klik tombol "Hapus" pada produk
4. Konfirmasi penghapusan
5. Produk akan dihapus (kecuali jika sedang dalam pesanan aktif)

### Untuk Pembeli:
1. Login sebagai pembeli
2. Selesaikan minimal 1 pesanan (status "selesai")
3. Buka Dashboard Pembeli
4. Klik tab "Rating Penjual"
5. Klik "Beri Rating" pada pesanan yang sudah selesai
6. Pilih rating 1-5 bintang dan tulis komentar
7. Submit rating

## 🔒 Validasi dan Keamanan

### Hapus Produk:
- ✅ Hanya penjual pemilik yang bisa hapus
- ✅ Tidak bisa hapus jika produk dalam pesanan aktif
- ✅ File gambar ikut terhapus
- ✅ Transaction rollback jika error

### Rating Penjual:
- ✅ Hanya pembeli yang sudah menyelesaikan pesanan
- ✅ Satu rating per pembeli per pesanan per penjual
- ✅ Validasi penjual terlibat dalam pesanan
- ✅ Rating 1-5 dengan validasi
- ✅ Auto-update average rating penjual

## 📊 Database Schema

```sql
-- Tabel rating penjual
CREATE TABLE rating_penjual (
  rating_id int(11) NOT NULL AUTO_INCREMENT,
  penjual_id int(11) NOT NULL,
  pembeli_id int(11) NOT NULL, 
  pesanan_id int(11) NOT NULL,
  rating int(11) NOT NULL CHECK (rating between 1 and 5),
  komentar text DEFAULT NULL,
  status enum('aktif','disembunyikan') DEFAULT 'aktif',
  dibuat_pada datetime DEFAULT current_timestamp(),
  PRIMARY KEY (rating_id),
  UNIQUE KEY unique_rating_per_order (pembeli_id, pesanan_id, penjual_id)
);

-- Tambah kolom di tabel user
ALTER TABLE user ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE user ADD COLUMN total_ratings INT(11) DEFAULT 0;
```

## 🧪 Testing

Jalankan test script:
```bash
cd backend
node test-rating-features.js
```

Atau test manual:
1. Start server: `npm run dev`
2. Buat akun penjual dan pembeli
3. Penjual upload produk
4. Pembeli beli dan selesaikan pesanan
5. Test hapus produk (penjual) dan rating (pembeli)

## 🎉 Status: COMPLETED ✅

Kedua fitur sudah diimplementasi lengkap dengan:
- ✅ Backend API endpoints
- ✅ Database schema
- ✅ Frontend UI dan interaksi
- ✅ Validasi dan error handling
- ✅ Auto-update rating cache
- ✅ File cleanup untuk produk
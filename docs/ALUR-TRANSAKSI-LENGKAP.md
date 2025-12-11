# 🔄 Alur Transaksi Lengkap - Lautan Kita

**Date**: December 10, 2025  
**Status**: ✅ COMPLETE

## 🎯 Overview

Sistem transaksi end-to-end dari checkout hingga pesanan selesai, terintegrasi dengan pembeli, penjual, dan kurir.

---

## 📊 Alur Lengkap

```
1. PEMBELI: Checkout
   ↓
2. SISTEM: Buat pesanan (status: menunggu)
   ↓
3. PEMBELI: Konfirmasi pembayaran
   ↓
4. SISTEM: Update status → PENDING
   ↓
5. PENJUAL: Lihat pesanan masuk
   ↓
6. PENJUAL: Kemas pesanan
   ↓
7. SISTEM: Update status → DIKEMAS
   ↓
8. KURIR: Lihat pesanan siap diambil
   ↓
9. KURIR: Ambil & kirim pesanan
   ↓
10. SISTEM: Update status → DIKIRIM
    ↓
11. PEMBELI: Konfirmasi diterima
    ↓
12. SISTEM: Update status → SELESAI
```

---

## 🛒 Step 1: Checkout (Pembeli)

### Halaman: `checkout.html`

**Proses**:
1. Pembeli review produk di keranjang
2. Pilih metode pembayaran (BNI/BCA/Mandiri/COD)
3. Klik tombol "Checkout"

**Backend API**:
```javascript
POST /orders/checkout
Body: { alamat_kirim: "Alamat lengkap" }
```

**Database Changes**:
```sql
-- Buat pesanan baru
INSERT INTO pesanan (pembeli_id, alamat_kirim, total_harga, status_pesanan)
VALUES (user_id, alamat, total, 'menunggu');

-- Simpan item pesanan
INSERT INTO pesanan_item (pesanan_id, produk_id, harga_saat_beli, jumlah, subtotal)
VALUES (...);

-- Kurangi stok produk
UPDATE produk SET stok = stok - jumlah WHERE produk_id = ...;

-- Kosongkan keranjang
DELETE FROM keranjang_item WHERE keranjang_id = ...;
```

**Response**:
```json
{
  "pesanan_id": 123,
  "total": 150000
}
```

**Status Pesanan**: `menunggu` (menunggu pembayaran)

---

## 💳 Step 2: Konfirmasi Pembayaran (Pembeli)

### Halaman: `checkout.html`

**Proses**:
1. Sistem buat record pembayaran
2. Tombol berubah jadi "Konfirmasi Pembayaran"
3. Pembeli klik "Konfirmasi Pembayaran"
4. Modal konfirmasi muncul
5. Pembeli klik "Sudah, Konfirmasi"

**Backend API 1 - Buat Pembayaran**:
```javascript
POST /payments
Body: { 
  pesanan_id: 123, 
  metode: "BNI" 
}
```

**Response**:
```json
{
  "pembayaran_id": 456,
  "status_pembayaran": "belum_dibayar"
}
```

**Backend API 2 - Konfirmasi Pembayaran**:
```javascript
POST /payments/:id/confirm
```

**Database Changes**:
```sql
-- Update status pembayaran
UPDATE pembayaran 
SET status_pembayaran = 'sudah_dibayar', paid_at = NOW() 
WHERE pembayaran_id = 456;

-- Update status pesanan
UPDATE pesanan 
SET status_pesanan = 'pending' 
WHERE pesanan_id = 123;
```

**Status Pesanan**: `menunggu` → `pending`

**Redirect**: `pembayaran-berhasil.html`

---

## 📦 Step 3: Pesanan Masuk ke Penjual

### Halaman: `dashboard-penjual.html` (Tab: Pesanan Masuk)

**Proses**:
1. Penjual login
2. Buka Dashboard Penjual
3. Klik tab "Pesanan Masuk"
4. Lihat pesanan dengan status PENDING

**Backend API**:
```javascript
GET /penjual/orders
```

**Response**:
```json
[
  {
    "pesanan_id": 123,
    "pembeli_id": 5,
    "status_pesanan": "pending",
    "created_at": "2025-12-10T10:00:00",
    "produk_id": 1,
    "nama_produk": "Ikan Kakap",
    "jumlah": 2,
    "subtotal": 150000
  }
]
```

**UI Display**:
- Card dengan border kuning (pending)
- Badge status: "Menunggu Konfirmasi"
- Tombol: "Kemas Pesanan"
- Detail produk & total harga

---

## 📦 Step 4: Penjual Kemas Pesanan

### Halaman: `dashboard-penjual.html`

**Proses**:
1. Penjual klik "Kemas Pesanan"
2. Modal konfirmasi muncul
3. Penjual konfirmasi
4. Status berubah ke DIKEMAS

**Backend API**:
```javascript
PATCH /orders/:id/pack
```

**Validation**:
- Pesanan harus berisi produk penjual
- Status harus PENDING

**Database Changes**:
```sql
UPDATE pesanan 
SET status_pesanan = 'dikemas', tanggal_dikemas = NOW() 
WHERE pesanan_id = 123 AND status_pesanan = 'pending';
```

**Status Pesanan**: `pending` → `dikemas`

**UI Update**:
- Badge berubah: "Sedang Dikemas" (biru)
- Tombol hilang
- Info: "Menunggu kurir untuk diambil"

---

## 🚚 Step 5: Pesanan Muncul di Dashboard Kurir

### Halaman: `dashboard-kurir-new.html` (Tab: Siap Diambil)

**Proses**:
1. Kurir login
2. Buka Dashboard Kurir
3. Tab "Siap Diambil" otomatis aktif
4. Lihat pesanan dengan status DIKEMAS

**Backend API**:
```javascript
GET /kurir/deliveries
```

**Response**:
```json
[
  {
    "pesanan_id": 123,
    "status": "dikemas",
    "total_harga": 150000,
    "alamat_kirim": "Jl. Example No. 123",
    "pembeli_nama": "John Doe",
    "pembeli_phone": "081234567890",
    "items_summary": "Ikan Kakap (2x)",
    "tanggal_dikemas": "2025-12-10T11:00:00"
  }
]
```

**UI Display**:
- Card dengan info lengkap
- Nama & alamat pembeli
- Telepon pembeli
- Detail produk
- Tombol: "Ambil & Kirim"

---

## 🚚 Step 6: Kurir Ambil & Kirim Pesanan

### Halaman: `dashboard-kurir-new.html`

**Proses**:
1. Kurir klik "Ambil & Kirim"
2. Modal konfirmasi muncul
3. Kurir konfirmasi
4. Status berubah ke DIKIRIM
5. Kurir ID tersimpan

**Backend API**:
```javascript
PATCH /orders/:id/ship
```

**Validation**:
- Status harus DIKEMAS

**Database Changes**:
```sql
UPDATE pesanan 
SET status_pesanan = 'dikirim', 
    kurir_id = current_user_id, 
    tanggal_dikirim = NOW() 
WHERE pesanan_id = 123 AND status_pesanan = 'dikemas';
```

**Status Pesanan**: `dikemas` → `dikirim`

**UI Update**:
- Pesanan pindah ke tab "Sedang Dikirim"
- Badge: "Dalam Pengiriman" (ungu)
- Info kurir tersimpan

---

## ✅ Step 7: Pembeli Konfirmasi Diterima

### Halaman: `tracking-pesanan.html`

**Proses**:
1. Pembeli buka tracking pesanan
2. Lihat pesanan dengan status DIKIRIM
3. Klik "Konfirmasi Diterima"
4. Modal konfirmasi muncul
5. Pembeli konfirmasi
6. Status berubah ke SELESAI

**Backend API**:
```javascript
PATCH /orders/:id/complete
```

**Validation**:
- User harus pembeli yang buat pesanan
- Status harus DIKIRIM

**Database Changes**:
```sql
UPDATE pesanan 
SET status_pesanan = 'selesai', tanggal_selesai = NOW() 
WHERE pesanan_id = 123 AND status_pesanan = 'dikirim';
```

**Status Pesanan**: `dikirim` → `selesai`

**UI Update**:
- Badge: "Selesai" (hijau)
- Tombol "Beri Ulasan" muncul
- Timeline completed

---

## 📊 Status Pesanan

| Status | Deskripsi | Siapa yang Update | Timestamp |
|--------|-----------|-------------------|-----------|
| **menunggu** | Pesanan dibuat, belum bayar | Sistem (checkout) | `created_at` |
| **pending** | Pembayaran dikonfirmasi | Pembeli (konfirmasi) | `created_at` |
| **dikemas** | Penjual sedang kemas | Penjual (kemas) | `tanggal_dikemas` |
| **dikirim** | Kurir sedang kirim | Kurir (ambil) | `tanggal_dikirim` |
| **selesai** | Pembeli terima | Pembeli (konfirmasi) | `tanggal_selesai` |
| **dibatalkan** | Pesanan dibatalkan | Pembeli (pending only) | - |

---

## 🔄 Integrasi Antar Role

### Pembeli → Penjual
**Trigger**: Konfirmasi pembayaran  
**Action**: Pesanan muncul di dashboard penjual  
**Status**: `pending`

### Penjual → Kurir
**Trigger**: Kemas pesanan  
**Action**: Pesanan muncul di dashboard kurir  
**Status**: `dikemas`

### Kurir → Pembeli
**Trigger**: Ambil & kirim  
**Action**: Tracking update di pembeli  
**Status**: `dikirim`

### Pembeli → Selesai
**Trigger**: Konfirmasi diterima  
**Action**: Transaksi selesai  
**Status**: `selesai`

---

## 🗄️ Database Schema

### Tabel: pesanan
```sql
CREATE TABLE pesanan (
  pesanan_id INT PRIMARY KEY AUTO_INCREMENT,
  pembeli_id INT NOT NULL,
  alamat_kirim TEXT,
  total_harga DECIMAL(10,2),
  status_pesanan ENUM('menunggu','pending','dikemas','dikirim','selesai','dibatalkan') DEFAULT 'menunggu',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggal_dikemas DATETIME NULL,
  tanggal_dikirim DATETIME NULL,
  tanggal_selesai DATETIME NULL,
  kurir_id INT NULL,
  ongkir DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (pembeli_id) REFERENCES user(user_id),
  FOREIGN KEY (kurir_id) REFERENCES user(user_id)
);
```

### Tabel: pembayaran
```sql
CREATE TABLE pembayaran (
  pembayaran_id INT PRIMARY KEY AUTO_INCREMENT,
  pesanan_id INT NOT NULL,
  metode ENUM('BNI','BCA','Mandiri','COD') NOT NULL,
  status_pembayaran ENUM('belum_dibayar','sudah_dibayar') DEFAULT 'belum_dibayar',
  paid_at DATETIME NULL,
  reference_gateway VARCHAR(255),
  FOREIGN KEY (pesanan_id) REFERENCES pesanan(pesanan_id)
);
```

---

## 🧪 Testing Flow

### Test Complete Transaction

**Step 1: Pembeli Checkout**
```
1. Login sebagai pembeli
2. Tambah produk ke keranjang
3. Buka checkout.html
4. Klik "Checkout"
5. Klik "Konfirmasi Pembayaran"
6. Konfirmasi di modal
✅ Status: menunggu → pending
```

**Step 2: Penjual Kemas**
```
1. Login sebagai penjual
2. Buka dashboard-penjual.html
3. Tab "Pesanan Masuk"
4. Klik "Kemas Pesanan"
5. Konfirmasi
✅ Status: pending → dikemas
```

**Step 3: Kurir Kirim**
```
1. Login sebagai kurir
2. Buka dashboard-kurir-new.html
3. Tab "Siap Diambil"
4. Klik "Ambil & Kirim"
5. Konfirmasi
✅ Status: dikemas → dikirim
```

**Step 4: Pembeli Terima**
```
1. Login sebagai pembeli
2. Buka tracking-pesanan.html
3. Klik "Konfirmasi Diterima"
4. Konfirmasi
✅ Status: dikirim → selesai
```

---

## 📱 Notifikasi (Future)

### Pembeli
- ✅ Pesanan dibuat
- ✅ Pembayaran dikonfirmasi
- 📧 Pesanan sedang dikemas (email)
- 📧 Pesanan dikirim (email + SMS)
- 📧 Pesanan selesai (email)

### Penjual
- 📧 Pesanan baru masuk (email)
- ✅ Pesanan dikemas
- 📧 Pesanan dikirim oleh kurir (email)

### Kurir
- 📧 Pesanan siap diambil (email + SMS)
- ✅ Pesanan diambil
- 📧 Pesanan selesai (email)

---

## 🐛 Troubleshooting

### Issue: Pesanan tidak muncul di dashboard penjual

**Check**:
1. Status pesanan = 'pending'?
2. Produk milik penjual?
3. Query `/penjual/orders` return data?

**Solution**:
```sql
SELECT * FROM pesanan p
JOIN pesanan_item pi ON pi.pesanan_id = p.pesanan_id
JOIN produk pr ON pr.produk_id = pi.produk_id
WHERE pr.penjual_id = [seller_id] AND p.status_pesanan = 'pending';
```

### Issue: Kurir tidak bisa ambil pesanan

**Check**:
1. Status pesanan = 'dikemas'?
2. Endpoint `/orders/:id/ship` accessible?
3. User role = 'kurir'?

**Solution**:
- Verify status in database
- Check backend logs
- Test API with Postman

### Issue: Status tidak update

**Check**:
1. Backend response OK?
2. Database updated?
3. Frontend refresh?

**Solution**:
- Check browser console
- Verify API response
- Check database directly
- Call `loadOrders()` after update

---

## ✅ Summary

### Alur Lengkap:
1. ✅ Checkout → Pesanan dibuat (menunggu)
2. ✅ Konfirmasi Pembayaran → Status: pending
3. ✅ Pesanan masuk ke penjual
4. ✅ Penjual kemas → Status: dikemas
5. ✅ Pesanan masuk ke kurir
6. ✅ Kurir kirim → Status: dikirim
7. ✅ Pembeli konfirmasi → Status: selesai

### API Endpoints:
- ✅ `POST /orders/checkout` - Buat pesanan
- ✅ `POST /payments` - Buat pembayaran
- ✅ `POST /payments/:id/confirm` - Konfirmasi bayar
- ✅ `GET /penjual/orders` - List pesanan penjual
- ✅ `PATCH /orders/:id/pack` - Kemas pesanan
- ✅ `GET /kurir/deliveries` - List pengiriman
- ✅ `PATCH /orders/:id/ship` - Kirim pesanan
- ✅ `GET /orders/my-orders` - Tracking pembeli
- ✅ `PATCH /orders/:id/complete` - Konfirmasi terima

### Status:
✅ **COMPLETE & INTEGRATED**

---

**Last Updated**: December 10, 2025

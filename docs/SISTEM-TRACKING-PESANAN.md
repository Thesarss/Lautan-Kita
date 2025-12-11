# 📦 Sistem Tracking Pesanan - Lautan Kita

**Last Updated**: December 10, 2025

## 🎯 Overview

Sistem tracking pesanan lengkap yang terintegrasi dengan semua role (Pembeli, Penjual, Kurir) untuk melacak status pesanan dari pembuatan hingga pengiriman selesai.

---

## 🔄 Alur Pesanan

```
1. PENDING (Menunggu Konfirmasi)
   ↓ [Pembeli membuat pesanan]
   
2. DIKEMAS (Sedang Dikemas)
   ↓ [Penjual mengemas pesanan]
   
3. DIKIRIM (Dalam Pengiriman)
   ↓ [Kurir mengambil & mengirim]
   
4. SELESAI (Pesanan Diterima)
   ✓ [Pembeli konfirmasi terima]
```

**Alternatif:**
- DIBATALKAN (Pembeli membatalkan saat status PENDING)

---

## 👥 Role & Aksi

### 1. Pembeli (Buyer)

#### Halaman: `tracking-pesanan.html`

**Fitur:**
- ✅ Lihat semua pesanan dengan timeline tracking
- ✅ Lihat detail produk yang dipesan
- ✅ Lihat informasi kurir (nama, telepon)
- ✅ Batalkan pesanan (hanya status PENDING)
- ✅ Konfirmasi pesanan diterima (status DIKIRIM → SELESAI)
- ✅ Beri ulasan setelah selesai

**API Endpoints:**
```javascript
GET  /orders/my-orders          // List semua pesanan dengan tracking
PATCH /orders/:id/cancel        // Batalkan pesanan (PENDING only)
PATCH /orders/:id/complete      // Konfirmasi diterima (DIKIRIM → SELESAI)
```

**Status yang Bisa Dilihat:**
- 🕐 PENDING - Menunggu konfirmasi penjual
- 📦 DIKEMAS - Penjual sedang menyiapkan
- 🚚 DIKIRIM - Kurir sedang mengirim
- ✅ SELESAI - Pesanan diterima
- ❌ DIBATALKAN - Pesanan dibatalkan

---

### 2. Penjual (Seller)

#### Halaman: `dashboard-penjual.html` (Tab: Pesanan Masuk)

**Fitur:**
- ✅ Lihat pesanan yang berisi produknya
- ✅ Update status ke DIKEMAS
- ✅ Lihat detail pembeli & alamat
- ✅ Notifikasi pesanan baru

**API Endpoints:**
```javascript
GET  /penjual/orders            // List pesanan yang berisi produk penjual
PATCH /orders/:id/pack          // Update ke DIKEMAS (PENDING → DIKEMAS)
```

**Aksi:**
1. Terima pesanan baru (status PENDING)
2. Kemas produk
3. Update status ke DIKEMAS
4. Tunggu kurir ambil

---

### 3. Kurir (Courier)

#### Halaman: `dashboard-kurir-new.html`

**Fitur:**
- ✅ Lihat pesanan siap diambil (status DIKEMAS)
- ✅ Ambil pesanan & update ke DIKIRIM
- ✅ Lihat pesanan yang sedang dikirim
- ✅ Lihat riwayat pengiriman
- ✅ Info pembeli (nama, alamat, telepon)

**API Endpoints:**
```javascript
GET  /kurir/deliveries          // List pesanan siap kirim & sedang dikirim
PATCH /orders/:id/ship          // Ambil & kirim (DIKEMAS → DIKIRIM)
```

**Aksi:**
1. Lihat pesanan siap diambil
2. Ambil pesanan (assign kurir_id)
3. Update status ke DIKIRIM
4. Kirim ke alamat pembeli
5. Tunggu pembeli konfirmasi

---

## 🗄️ Database Schema

### Tabel: `pesanan`

```sql
CREATE TABLE pesanan (
  pesanan_id INT PRIMARY KEY AUTO_INCREMENT,
  pembeli_id INT NOT NULL,
  alamat_kirim TEXT,
  total_harga DECIMAL(10,2),
  status_pesanan ENUM('pending','dikemas','dikirim','selesai','dibatalkan') DEFAULT 'pending',
  
  -- Tracking timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tanggal_dikemas DATETIME NULL,
  tanggal_dikirim DATETIME NULL,
  tanggal_selesai DATETIME NULL,
  
  -- Kurir info
  kurir_id INT NULL,
  ongkir DECIMAL(10,2) DEFAULT 0,
  
  FOREIGN KEY (pembeli_id) REFERENCES user(user_id),
  FOREIGN KEY (kurir_id) REFERENCES user(user_id)
);
```

### Auto-Update Schema

Backend otomatis menambahkan kolom tracking saat startup:
- `tanggal_dikemas`
- `tanggal_dikirim`
- `tanggal_selesai`
- `kurir_id`
- `ongkir`

---

## 🔌 API Endpoints

### Pembeli

#### GET `/orders/my-orders`
**Auth**: Required (pembeli)  
**Response**:
```json
[
  {
    "pesanan_id": 1,
    "status": "dikirim",
    "total_harga": 150000,
    "ongkir": 15000,
    "alamat_kirim": "Jl. Example No. 123",
    "tanggal_pesanan": "2025-12-10T10:00:00",
    "tanggal_dikemas": "2025-12-10T11:00:00",
    "tanggal_dikirim": "2025-12-10T12:00:00",
    "tanggal_selesai": null,
    "kurir_id": 5,
    "kurir_nama": "Budi Kurir",
    "kurir_phone": "081234567890",
    "kurir_avatar": "/uploads/avatars/kurir.jpg",
    "items": [
      {
        "produk_id": 1,
        "nama_produk": "Ikan Kakap",
        "jumlah": 2,
        "harga": 75000,
        "photo_url": "/uploads/products/kakap.jpg"
      }
    ]
  }
]
```

#### PATCH `/orders/:id/cancel`
**Auth**: Required (pembeli)  
**Condition**: Status harus PENDING  
**Response**:
```json
{ "ok": true }
```

#### PATCH `/orders/:id/complete`
**Auth**: Required (pembeli)  
**Condition**: Status harus DIKIRIM  
**Response**:
```json
{ "ok": true }
```

---

### Penjual

#### GET `/penjual/orders`
**Auth**: Required (penjual)  
**Response**: List pesanan yang berisi produk penjual

#### PATCH `/orders/:id/pack`
**Auth**: Required (penjual)  
**Condition**: 
- Pesanan berisi produk penjual
- Status harus PENDING  
**Response**:
```json
{ "ok": true }
```

---

### Kurir

#### GET `/kurir/deliveries`
**Auth**: Required (kurir)  
**Response**:
```json
[
  {
    "pesanan_id": 1,
    "status": "dikemas",
    "total_harga": 150000,
    "alamat_kirim": "Jl. Example No. 123",
    "pembeli_nama": "John Doe",
    "pembeli_phone": "081234567890",
    "items_summary": "Ikan Kakap (2x), Udang (1x)",
    "tanggal_dikemas": "2025-12-10T11:00:00"
  }
]
```

#### PATCH `/orders/:id/ship`
**Auth**: Required (kurir)  
**Condition**: Status harus DIKEMAS  
**Action**: 
- Set `kurir_id` = current user
- Update status ke DIKIRIM
- Set `tanggal_dikirim` = NOW()

**Response**:
```json
{ "ok": true }
```

---

## 🎨 UI Components

### Timeline Tracking (Pembeli)

```html
<div class="timeline">
  <div class="timeline-item completed">
    <div class="timeline-icon">✓</div>
    <div class="timeline-content">
      <div class="timeline-title">Pesanan Dibuat</div>
      <div class="timeline-time">10 Des 2025, 10:00</div>
    </div>
  </div>
  
  <div class="timeline-item active">
    <div class="timeline-icon">📦</div>
    <div class="timeline-content">
      <div class="timeline-title">Sedang Dikemas</div>
      <div class="timeline-time">10 Des 2025, 11:00</div>
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-icon">🚚</div>
    <div class="timeline-content">
      <div class="timeline-title">Dalam Pengiriman</div>
    </div>
  </div>
  
  <div class="timeline-item">
    <div class="timeline-icon">✅</div>
    <div class="timeline-content">
      <div class="timeline-title">Pesanan Selesai</div>
    </div>
  </div>
</div>
```

### Status Badge

```html
<span class="status-badge status-pending">Menunggu Konfirmasi</span>
<span class="status-badge status-dikemas">Sedang Dikemas</span>
<span class="status-badge status-dikirim">Dalam Pengiriman</span>
<span class="status-badge status-selesai">Selesai</span>
<span class="status-badge status-dibatalkan">Dibatalkan</span>
```

---

## 🧪 Testing Flow

### Test 1: Complete Order Flow

1. **Pembeli**: Login & buat pesanan
   ```
   - Tambah produk ke keranjang
   - Checkout
   - Status: PENDING
   ```

2. **Penjual**: Kemas pesanan
   ```
   - Login sebagai penjual
   - Buka dashboard → Tab "Pesanan Masuk"
   - Klik "Kemas Pesanan"
   - Status: PENDING → DIKEMAS
   ```

3. **Kurir**: Ambil & kirim
   ```
   - Login sebagai kurir
   - Buka dashboard kurir
   - Tab "Siap Diambil"
   - Klik "Ambil & Kirim"
   - Status: DIKEMAS → DIKIRIM
   ```

4. **Pembeli**: Konfirmasi diterima
   ```
   - Buka tracking-pesanan.html
   - Klik "Konfirmasi Diterima"
   - Status: DIKIRIM → SELESAI
   ```

### Test 2: Cancel Order

1. **Pembeli**: Buat pesanan (status PENDING)
2. **Pembeli**: Batalkan pesanan
   ```
   - Buka tracking-pesanan.html
   - Klik "Batalkan Pesanan"
   - Status: PENDING → DIBATALKAN
   - Stok produk dikembalikan
   ```

---

## 🐛 Troubleshooting

### Issue: Kurir tidak bisa ambil pesanan

**Solusi:**
1. Pastikan status pesanan = DIKEMAS
2. Pastikan user login sebagai kurir
3. Check database: `SELECT * FROM pesanan WHERE pesanan_id = X`

### Issue: Pembeli tidak bisa konfirmasi diterima

**Solusi:**
1. Pastikan status pesanan = DIKIRIM
2. Pastikan user adalah pembeli yang buat pesanan
3. Check: `SELECT pembeli_id, status_pesanan FROM pesanan WHERE pesanan_id = X`

### Issue: Timeline tidak update

**Solusi:**
1. Check kolom timestamp di database
2. Pastikan backend update timestamp saat update status
3. Refresh halaman tracking

---

## 📱 Mobile Responsive

Semua halaman tracking sudah responsive:
- ✅ `tracking-pesanan.html`
- ✅ `dashboard-kurir-new.html`
- ✅ `dashboard-penjual.html` (tab pesanan)

---

## 🚀 Future Improvements

1. **Real-time Updates**
   - WebSocket untuk notifikasi real-time
   - Auto-refresh status

2. **GPS Tracking**
   - Integrasi Google Maps
   - Live location kurir
   - Estimasi waktu tiba

3. **Notifications**
   - Email notification
   - SMS notification
   - Push notification

4. **Rating System**
   - Rating kurir
   - Rating penjual
   - Rating produk

5. **Analytics**
   - Delivery time analytics
   - Kurir performance
   - Order completion rate

---

## 📝 Summary

### Files Created/Updated:

**Frontend:**
- ✅ `tracking-pesanan.html` - Halaman tracking untuk pembeli
- ✅ `dashboard-kurir-new.html` - Dashboard kurir dengan tracking
- ✅ `dashboard-penjual.html` - Modal scroll fix + tab pesanan

**Backend:**
- ✅ `backend/src/routes/orders.js` - Endpoint tracking lengkap
- ✅ `backend/src/app.js` - Auto-update schema tracking
- ✅ `backend/update-schema-tracking.sql` - SQL schema tracking

**Documentation:**
- ✅ `docs/SISTEM-TRACKING-PESANAN.md` - Dokumentasi lengkap

### API Endpoints Added:

```
GET   /orders/my-orders          - Pembeli: list pesanan dengan tracking
PATCH /orders/:id/cancel         - Pembeli: batalkan pesanan
PATCH /orders/:id/complete       - Pembeli: konfirmasi diterima
PATCH /orders/:id/pack           - Penjual: update ke dikemas
PATCH /orders/:id/ship           - Kurir: ambil & kirim
GET   /kurir/deliveries          - Kurir: list pengiriman
```

### Database Columns Added:

```sql
pesanan.tanggal_dikemas  DATETIME
pesanan.tanggal_dikirim  DATETIME
pesanan.tanggal_selesai  DATETIME
pesanan.kurir_id         INT
pesanan.ongkir           DECIMAL(10,2)
```

---

**Status**: ✅ Complete & Ready to Use

**Last Updated**: December 10, 2025

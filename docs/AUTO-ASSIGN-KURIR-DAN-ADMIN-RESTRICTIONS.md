# Auto-Assign Kurir & Admin Restrictions

## Status: ✅ COMPLETED

Dokumentasi implementasi sistem auto-assign kurir dan pembatasan akses admin untuk pembelian produk.

---

## 1. AUTO-ASSIGN KURIR (Round-Robin)

### Implementasi
Saat penjual mengemas pesanan, sistem secara otomatis memilih kurir dengan algoritma round-robin berdasarkan jumlah pengiriman aktif.

### Endpoint: `PATCH /orders/:id/pack`
**File**: `backend/src/routes/orders.js`

**Algoritma**:
```sql
SELECT user_id, 
  (SELECT COUNT(*) FROM pesanan WHERE kurir_id = user.user_id AND status_pesanan IN ('dikirim')) as active_deliveries
FROM user 
WHERE role = 'kurir' 
ORDER BY active_deliveries ASC, RAND() 
LIMIT 1
```

**Cara Kerja**:
1. Query semua kurir yang tersedia
2. Hitung jumlah pengiriman aktif (status: dikirim) untuk setiap kurir
3. Urutkan berdasarkan jumlah pengiriman aktif (ASC) - kurir dengan pengiriman paling sedikit diprioritaskan
4. Jika ada beberapa kurir dengan jumlah pengiriman sama, pilih secara acak (RAND())
5. Assign kurir terpilih ke pesanan

**Keuntungan**:
- ✅ Distribusi beban kerja merata antar kurir
- ✅ Kurir dengan pengiriman sedikit mendapat prioritas
- ✅ Otomatis tanpa intervensi manual
- ✅ Fair distribution dengan random selection untuk tie-breaker

### Alur Lengkap
```
1. Pembeli checkout → status: menunggu
2. Pembeli konfirmasi bayar → status: pending
3. Penjual kemas pesanan → status: dikemas + AUTO-ASSIGN KURIR
4. Kurir ambil & kirim → status: dikirim
5. Pembeli konfirmasi terima → status: selesai
```

### Testing
```bash
# 1. Login sebagai penjual
# 2. Buka dashboard penjual
# 3. Klik "Kemas Pesanan" pada pesanan dengan status PENDING
# 4. Sistem akan otomatis assign kurir
# 5. Cek di dashboard kurir - pesanan akan muncul di tab "Siap Diambil"
```

---

## 2. ADMIN RESTRICTIONS (Tidak Bisa Membeli)

### Implementasi
Admin tidak dapat membeli produk di aplikasi. Validasi dilakukan di 3 layer:

### Layer 1: Backend API Protection
**File**: `backend/src/routes/carts.js`, `backend/src/routes/orders.js`

Semua endpoint cart dan order sudah protected dengan:
```javascript
requireRole(['pembeli'])
```

Endpoint yang di-protect:
- `POST /carts/items` - Tambah ke keranjang
- `GET /carts` - Lihat keranjang
- `PATCH /carts/items/:id` - Update jumlah
- `DELETE /carts/items/:id` - Hapus item
- `POST /orders/checkout` - Checkout
- `GET /orders/my-orders` - Tracking pesanan
- `PATCH /orders/:id/complete` - Konfirmasi terima
- `PATCH /orders/:id/cancel` - Batalkan pesanan

**Response jika admin mencoba akses**: `403 Forbidden`

### Layer 2: Frontend Page-Level Validation
**File**: `keranjang.html`, `checkout.html`, `tracking-pesanan.html`

Validasi saat page load:
```javascript
const meResp = await API.authFetch('/auth/me');
const user = await meResp.json();

if (user.role === 'admin') {
  // Show error message
  // Redirect to admin panel
}
```

### Layer 3: Frontend Action-Level Validation
**File**: `home_final.html`, `detail-produk.html`

#### A. Hide Cart Button
```javascript
if (user.role === 'admin') {
  document.getElementById('navCartButton').style.display = 'none';
}
```

#### B. Block "Tambah ke Keranjang" Action
**home_final.html** - `addToCart()` function:
```javascript
function addToCart(name, price, image) {
  if (window.currentRole === 'admin') { 
    API.showModal({ 
      title: 'Akun Admin', 
      message: 'Akun admin tidak dapat membeli produk. Kelola sistem di admin panel.' 
    }); 
    return; 
  }
  // ... rest of code
}
```

**detail-produk.html** - `addToCartFromDetail()` function:
```javascript
if (user.role === 'admin') {
  API.showModal({
    title: 'Akun Admin',
    message: 'Akun admin tidak dapat membeli produk. Kelola sistem di admin panel.',
    actions: [{ label: 'OK', variant: 'primary', handler: API.hideModal }]
  });
  return;
}
```

#### C. Block "Beli Sekarang" Action
**detail-produk.html** - `buyNowFromDetail()` function:
```javascript
if (user.role === 'admin') {
  API.showModal({
    title: 'Akun Admin',
    message: 'Akun admin tidak dapat membeli produk. Kelola sistem di admin panel.',
    actions: [{ label: 'OK', variant: 'primary', handler: API.hideModal }]
  });
  return;
}
```

### Multi-Layer Security Summary
```
┌─────────────────────────────────────────┐
│ Layer 1: Backend API (403 Forbidden)   │
├─────────────────────────────────────────┤
│ Layer 2: Page-Level Check (Redirect)   │
├─────────────────────────────────────────┤
│ Layer 3: Action-Level Block (Modal)    │
└─────────────────────────────────────────┘
```

### Testing Admin Restrictions
```bash
# 1. Login sebagai admin (admin@lautankita.com / Admin123456)
# 2. Buka home_final.html
# 3. Verifikasi:
#    - Cart button TIDAK TERLIHAT di navbar
#    - Klik "Tambah ke Keranjang" → Modal error muncul
#    - Klik "Beli Sekarang" → Modal error muncul
# 4. Coba akses langsung:
#    - keranjang.html → Error message + redirect
#    - checkout.html → Error message + redirect
#    - tracking-pesanan.html → Error message + redirect
```

---

## 3. ADMIN PANEL FEATURES

### Current Features (Sudah Lengkap)
**File**: `admin.html`

#### Dashboard
- ✅ Total Pengguna
- ✅ Total Produk
- ✅ Total Pesanan
- ✅ Total Ulasan

#### Kelola Pengguna
- ✅ List semua user (pembeli, penjual, kurir, admin)
- ✅ Edit user (nama, email, role, verified status)
- ✅ Filter by role
- ✅ Search by nama/email

#### Kelola Produk
- ✅ List semua produk
- ✅ Lihat detail produk (nama, penjual, harga, stok, status)
- ✅ Update status produk (aktif/nonaktif)

#### Kelola Pesanan
- ✅ Placeholder untuk fitur kelola pesanan
- 🔄 TODO: Implementasi list & update status pesanan

#### Laporan Transaksi
- ✅ List semua transaksi pembayaran
- ✅ Filter by tanggal (dari - sampai)
- ✅ Filter by status (pending, confirmed, failed)
- ✅ Export to CSV
- ✅ Ringkasan statistik:
  - Total transaksi (Rp)
  - Transaksi berhasil (count)
  - Transaksi pending (count)
  - Transaksi gagal (count)
- ✅ View detail transaksi (modal)

#### Moderasi Ulasan
- ✅ List semua ulasan
- ✅ Filter by status (aktif, disembunyikan)
- ✅ Filter by rating (1-5 bintang)
- ✅ Tampilkan ulasan (status: aktif)
- ✅ Sembunyikan ulasan (status: disembunyikan)
- ✅ View detail ulasan (modal)

### Backend Endpoints (Sudah Tersedia)
**File**: `backend/src/routes/admin.js`

```javascript
GET    /admin/users                    // List users
PATCH  /admin/users/:id                // Edit user
PATCH  /admin/users/:id/verify         // Update verified status
PATCH  /admin/users/:id/role           // Update role

GET    /admin/transactions             // List transactions
GET    /admin/reviews                  // List reviews
PATCH  /admin/reviews/:id/status       // Update review status

PATCH  /admin/products/:id/status      // Update product status
GET    /admin/reports/sales            // Sales report
GET    /admin/reports/payouts          // Payout report
```

---

## 4. ROLE RESTRICTIONS SUMMARY

### Pembeli (Buyer)
- ✅ Dapat membeli produk
- ✅ Dapat tambah ke keranjang
- ✅ Dapat checkout
- ✅ Dapat tracking pesanan
- ✅ Dapat konfirmasi terima pesanan
- ✅ Dapat memberikan ulasan

### Penjual (Seller)
- ❌ TIDAK dapat membeli produk
- ✅ Dapat tambah produk
- ✅ Dapat kemas pesanan
- ✅ Dapat lihat pesanan masuk

### Kurir (Courier)
- ❌ TIDAK dapat membeli produk
- ✅ Dapat ambil pesanan (auto-assigned)
- ✅ Dapat update status pengiriman
- ✅ Dapat lihat riwayat pengiriman

### Admin (Administrator)
- ❌ TIDAK dapat membeli produk
- ✅ Dapat kelola semua user
- ✅ Dapat kelola semua produk
- ✅ Dapat lihat laporan transaksi
- ✅ Dapat moderasi ulasan
- ✅ Full access ke admin panel

---

## 5. FILES MODIFIED

### Frontend
1. `home_final.html` - Added admin validation in `addToCart()` function
2. `detail-produk.html` - Added admin validation in `addToCartFromDetail()` and `buyNowFromDetail()` functions
3. `admin.html` - Already complete with all features

### Backend
1. `backend/src/routes/orders.js` - Auto-assign kurir in `/orders/:id/pack` endpoint
2. `backend/src/routes/admin.js` - Already complete with all admin endpoints

---

## 6. TESTING CHECKLIST

### Auto-Assign Kurir
- [ ] Login sebagai penjual
- [ ] Kemas pesanan dengan status PENDING
- [ ] Verifikasi kurir ter-assign otomatis
- [ ] Login sebagai kurir yang ter-assign
- [ ] Verifikasi pesanan muncul di dashboard kurir
- [ ] Test dengan multiple kurir (distribusi merata)

### Admin Restrictions
- [ ] Login sebagai admin
- [ ] Verifikasi cart button tidak terlihat
- [ ] Coba klik "Tambah ke Keranjang" → Modal error
- [ ] Coba klik "Beli Sekarang" → Modal error
- [ ] Coba akses keranjang.html → Redirect
- [ ] Coba akses checkout.html → Redirect
- [ ] Coba akses tracking-pesanan.html → Redirect

### Admin Panel
- [ ] Login sebagai admin
- [ ] Buka admin.html
- [ ] Test kelola pengguna (edit user)
- [ ] Test kelola produk (update status)
- [ ] Test laporan transaksi (filter, export CSV)
- [ ] Test moderasi ulasan (tampilkan/sembunyikan)

---

## 7. NEXT STEPS (Optional Enhancements)

### Kelola Pesanan di Admin Panel
- [ ] Implementasi list semua pesanan
- [ ] Filter by status (pending, dikemas, dikirim, selesai, dibatalkan)
- [ ] Update status pesanan
- [ ] View detail pesanan dengan items

### Analytics Dashboard
- [ ] Grafik penjualan per hari/minggu/bulan
- [ ] Top selling products
- [ ] Top sellers
- [ ] Revenue analytics

### System Settings
- [ ] Konfigurasi ongkir
- [ ] Konfigurasi metode pembayaran
- [ ] Email notifications settings

---

## CONCLUSION

✅ **Auto-assign kurir**: Implemented dengan algoritma round-robin yang fair
✅ **Admin restrictions**: Implemented dengan 3-layer security (backend, page-level, action-level)
✅ **Admin panel**: Sudah lengkap dengan fitur kelola user, produk, transaksi, dan ulasan

Semua fitur sudah terintegrasi dengan baik dan siap untuk testing!

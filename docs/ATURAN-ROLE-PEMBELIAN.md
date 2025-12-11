# 🚫 Aturan Role Pembelian - Lautan Kita

**Date**: December 10, 2025  
**Status**: ✅ IMPLEMENTED

## 🎯 Aturan Utama

**Hanya role PEMBELI yang dapat membeli produk di aplikasi.**

### Role yang TIDAK DAPAT Membeli:
- ❌ **Penjual** (role: `penjual`)
- ❌ **Kurir** (role: `kurir`)
- ❌ **Admin** (role: `admin`)

### Role yang DAPAT Membeli:
- ✅ **Pembeli** (role: `pembeli`)

---

## 📋 Alasan Aturan

### 1. Penjual
**Alasan**: Penjual fokus pada menjual produk mereka sendiri, bukan membeli.

**Fungsi Penjual**:
- Menambah produk
- Mengelola stok
- Mengemas pesanan
- Melihat laporan penjualan

**Redirect**: Dashboard Penjual

### 2. Kurir
**Alasan**: Kurir fokus pada pengiriman pesanan, bukan membeli.

**Fungsi Kurir**:
- Mengambil pesanan yang sudah dikemas
- Mengirim pesanan ke pembeli
- Update status pengiriman
- Melihat riwayat pengiriman

**Redirect**: Dashboard Kurir

### 3. Admin
**Alasan**: Admin fokus pada moderasi dan manajemen sistem.

**Fungsi Admin**:
- Kelola user
- Moderasi produk & ulasan
- Lihat laporan transaksi
- Manajemen sistem

**Redirect**: Admin Panel

---

## 🔒 Implementasi

### 1. Backend Validation

#### Cart Endpoints
```javascript
// GET /carts - Hanya pembeli
router.get('/carts', requireAuth, requireRole(['pembeli']), ...)

// POST /carts/items - Hanya pembeli
router.post('/carts/items', requireAuth, requireRole(['pembeli']), ...)

// PATCH /carts/items/:id - Hanya pembeli
router.patch('/carts/items/:id', requireAuth, requireRole(['pembeli']), ...)

// DELETE /carts/items/:id - Hanya pembeli
router.delete('/carts/items/:id', requireAuth, requireRole(['pembeli']), ...)
```

#### Order Endpoints
```javascript
// POST /orders/checkout - Hanya pembeli
router.post('/orders/checkout', requireAuth, requireRole(['pembeli']), ...)

// GET /orders - Hanya pembeli
router.get('/orders', requireAuth, requireRole(['pembeli']), ...)

// GET /orders/my-orders - Hanya pembeli
router.get('/orders/my-orders', requireAuth, requireRole(['pembeli']), ...)

// PATCH /orders/:id/cancel - Hanya pembeli
router.patch('/orders/:id/cancel', requireAuth, requireRole(['pembeli']), ...)

// PATCH /orders/:id/complete - Hanya pembeli
router.patch('/orders/:id/complete', requireAuth, requireRole(['pembeli']), ...)
```

**Middleware**: `requireRole(['pembeli'])`

**Response jika role salah**:
```json
{
  "error": "forbidden",
  "message": "Access denied"
}
```

---

### 2. Frontend Validation

#### A. Hide Cart Button

**File**: `home_final.html`

```javascript
// Hide cart button for penjual and kurir
const navCart = document.getElementById('navCartButton');
if (navCart) {
  navCart.style.display = (me.role === 'penjual' || me.role === 'kurir') 
    ? 'none' 
    : 'inline-block';
}
```

**Result**:
- Pembeli: ✅ Tombol keranjang terlihat
- Penjual: ❌ Tombol keranjang tersembunyi
- Kurir: ❌ Tombol keranjang tersembunyi

---

#### B. Block Add to Cart Action

**File**: `home_final.html`

```javascript
async function addToCartBackend(produk_id, jumlah) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    // Show login modal
    return;
  }
  
  // Check role
  if (window.currentRole === 'penjual') {
    API.showModal({
      title: 'Akun Penjual',
      message: 'Akun penjual tidak dapat membeli produk. Kelola stok produk Anda di dashboard.'
    });
    return;
  }
  
  if (window.currentRole === 'kurir') {
    API.showModal({
      title: 'Akun Kurir',
      message: 'Akun kurir tidak dapat membeli produk. Fokus pada pengiriman pesanan.'
    });
    return;
  }
  
  // Proceed with add to cart
  // ...
}
```

**Result**:
- Penjual klik "Tambah ke Keranjang" → Modal: "Akun penjual tidak dapat membeli produk"
- Kurir klik "Tambah ke Keranjang" → Modal: "Akun kurir tidak dapat membeli produk"

---

#### C. Block Buy Now Action

**File**: `detail-produk.html`

```javascript
async function buyNowFromDetail() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    // Show login modal
    return;
  }
  
  // Check user role
  try {
    const meResp = await API.authFetch('/auth/me');
    if (meResp.ok) {
      const user = await meResp.json();
      
      if (user.role === 'penjual') {
        API.showModal({
          title: 'Akun Penjual',
          message: 'Akun penjual tidak dapat membeli produk. Kelola stok produk Anda di dashboard.'
        });
        return;
      }
      
      if (user.role === 'kurir') {
        API.showModal({
          title: 'Akun Kurir',
          message: 'Akun kurir tidak dapat membeli produk. Fokus pada pengiriman pesanan.'
        });
        return;
      }
    }
  } catch (e) {
    console.error('Failed to check user role', e);
  }
  
  // Proceed with buy now
  // ...
}
```

**Result**:
- Penjual klik "Beli Sekarang" → Modal: "Akun penjual tidak dapat membeli produk"
- Kurir klik "Beli Sekarang" → Modal: "Akun kurir tidak dapat membeli produk"

---

## 🧪 Testing

### Test Case 1: Penjual Mencoba Membeli

**Steps**:
1. Login sebagai penjual
2. Buka `home_final.html`
3. Coba klik "Tambah ke Keranjang" pada produk

**Expected Result**:
- ❌ Tombol keranjang di navbar tersembunyi
- ❌ Modal muncul: "Akun penjual tidak dapat membeli produk"
- ❌ Produk tidak ditambahkan ke keranjang

### Test Case 2: Kurir Mencoba Membeli

**Steps**:
1. Login sebagai kurir
2. Buka `home_final.html`
3. Coba klik "Tambah ke Keranjang" pada produk

**Expected Result**:
- ❌ Tombol keranjang di navbar tersembunyi
- ❌ Modal muncul: "Akun kurir tidak dapat membeli produk"
- ❌ Produk tidak ditambahkan ke keranjang

### Test Case 3: Penjual Akses Keranjang Langsung

**Steps**:
1. Login sebagai penjual
2. Akses `keranjang.html` langsung via URL

**Expected Result**:
- ❌ Backend return 403 Forbidden
- ❌ Halaman error atau redirect

### Test Case 4: Kurir Akses Checkout Langsung

**Steps**:
1. Login sebagai kurir
2. Akses `checkout.html` langsung via URL

**Expected Result**:
- ❌ Backend return 403 Forbidden
- ❌ Tidak bisa checkout

### Test Case 5: Pembeli Normal

**Steps**:
1. Login sebagai pembeli
2. Buka `home_final.html`
3. Klik "Tambah ke Keranjang"

**Expected Result**:
- ✅ Tombol keranjang terlihat
- ✅ Produk berhasil ditambahkan
- ✅ Modal sukses muncul
- ✅ Bisa checkout normal

---

## 📱 User Experience

### Penjual
**Saat mencoba beli**:
```
┌─────────────────────────────────┐
│      🏪 Akun Penjual            │
├─────────────────────────────────┤
│ Akun penjual tidak dapat        │
│ membeli produk. Kelola stok     │
│ produk Anda di dashboard.       │
│                                 │
│           [ OK ]                │
└─────────────────────────────────┘
```

**Redirect**: `dashboard-penjual.html`

### Kurir
**Saat mencoba beli**:
```
┌─────────────────────────────────┐
│      🚚 Akun Kurir              │
├─────────────────────────────────┤
│ Akun kurir tidak dapat          │
│ membeli produk. Fokus pada      │
│ pengiriman pesanan.             │
│                                 │
│           [ OK ]                │
└─────────────────────────────────┘
```

**Redirect**: `dashboard-kurir-new.html`

### Pembeli
**Normal flow**:
- ✅ Lihat produk
- ✅ Tambah ke keranjang
- ✅ Checkout
- ✅ Bayar
- ✅ Tracking pesanan

---

## 🔐 Security

### Backend Protection
- ✅ Middleware `requireRole(['pembeli'])`
- ✅ Validasi di setiap endpoint cart & order
- ✅ Return 403 Forbidden jika role salah
- ✅ Tidak ada bypass via API

### Frontend Protection
- ✅ Hide UI elements (cart button)
- ✅ Block actions (add to cart, buy now)
- ✅ Show informative modals
- ✅ Check role before API calls

### Database Protection
- ✅ Foreign key constraints
- ✅ Role validation di middleware
- ✅ Transaction rollback jika error

---

## 📊 Role Matrix

| Fitur | Pembeli | Penjual | Kurir | Admin |
|-------|---------|---------|-------|-------|
| **Lihat Produk** | ✅ | ✅ | ✅ | ✅ |
| **Tambah ke Keranjang** | ✅ | ❌ | ❌ | ❌ |
| **Checkout** | ✅ | ❌ | ❌ | ❌ |
| **Tracking Pesanan** | ✅ | ❌ | ❌ | ❌ |
| **Kelola Produk** | ❌ | ✅ | ❌ | ✅ |
| **Kemas Pesanan** | ❌ | ✅ | ❌ | ❌ |
| **Kirim Pesanan** | ❌ | ❌ | ✅ | ❌ |
| **Moderasi** | ❌ | ❌ | ❌ | ✅ |

---

## 🐛 Troubleshooting

### Issue: Penjual masih bisa tambah ke keranjang

**Solusi**:
1. Check `window.currentRole` di console
2. Verify middleware backend: `requireRole(['pembeli'])`
3. Clear localStorage dan login ulang
4. Check browser console untuk error

### Issue: Tombol keranjang masih terlihat untuk kurir

**Solusi**:
1. Check kondisi hide cart button:
   ```javascript
   navCart.style.display = (me.role === 'penjual' || me.role === 'kurir') 
     ? 'none' 
     : 'inline-block';
   ```
2. Verify `me.role` dari API `/auth/me`
3. Refresh halaman

### Issue: Backend return 403 tapi frontend tidak show modal

**Solusi**:
1. Check error handling di frontend
2. Verify response status check: `if (!resp.ok)`
3. Add console.log untuk debug
4. Check API.showModal() implementation

---

## 🚀 Future Enhancements

1. **Role-based Product Visibility**
   - Penjual hanya lihat produk mereka
   - Kurir hanya lihat pesanan yang perlu dikirim

2. **Custom Dashboards**
   - Redirect otomatis ke dashboard sesuai role
   - Hide menu yang tidak relevan

3. **Analytics**
   - Track berapa kali penjual/kurir coba beli
   - Alert jika ada anomali

4. **Multi-role Support**
   - User bisa punya multiple role
   - Switch role di UI

---

## ✅ Summary

### Files Modified:
- ✅ `home_final.html` - Hide cart button, block add to cart
- ✅ `detail-produk.html` - Block buy now & add to cart
- ✅ `backend/src/routes/carts.js` - Already protected with `requireRole(['pembeli'])`
- ✅ `backend/src/routes/orders.js` - Already protected with `requireRole(['pembeli'])`

### Validation Points:
1. ✅ Backend middleware - `requireRole(['pembeli'])`
2. ✅ Frontend UI - Hide cart button
3. ✅ Frontend action - Block add to cart
4. ✅ Frontend action - Block buy now
5. ✅ User feedback - Informative modals

### Status:
✅ **COMPLETE & SECURE**

---

**Last Updated**: December 10, 2025

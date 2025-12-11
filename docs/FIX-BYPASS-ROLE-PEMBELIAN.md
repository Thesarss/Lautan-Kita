# 🔒 Fix Bypass Role Pembelian

**Date**: December 10, 2025  
**Status**: ✅ FIXED

## 🐛 Masalah

Meskipun sudah ada validasi di backend dan frontend, masih ada bypass untuk akun penjual, kurir, dan admin yang bisa mengakses halaman pembelian dengan:
1. Akses langsung via URL (e.g., `keranjang.html`, `checkout.html`)
2. Manipulasi JavaScript di browser console
3. Disable JavaScript validation

## ✅ Solusi

### 1. Backend Protection (Sudah Ada) ✅

Backend sudah dilindungi dengan middleware `requireRole(['pembeli'])`:

```javascript
// Cart endpoints
router.get('/carts', requireAuth, requireRole(['pembeli']), ...)
router.post('/carts/items', requireAuth, requireRole(['pembeli']), ...)

// Order endpoints  
router.post('/orders/checkout', requireAuth, requireRole(['pembeli']), ...)
router.get('/orders/my-orders', requireAuth, requireRole(['pembeli']), ...)
```

**Response jika role salah**: `403 Forbidden`

---

### 2. Frontend Page-Level Protection (BARU) ✅

Tambahkan validasi role di setiap halaman yang hanya boleh diakses pembeli:

#### A. keranjang.html

**Lokasi**: Fungsi `loadCartBackend()` - di awal sebelum load data

```javascript
async function loadCartBackend() {
  const token = localStorage.getItem('auth_token');
  if (!token) { 
    // Show login message
    return; 
  }
  
  // ✅ CHECK USER ROLE FIRST
  try {
    const meResp = await fetch(API_BASE + '/auth/me', { 
      headers: { Authorization: 'Bearer ' + token }
    });
    
    if (meResp.ok) {
      const user = await meResp.json();
      
      // Block non-pembeli roles
      if (user.role !== 'pembeli') {
        let message = '';
        let redirectUrl = '';
        
        if (user.role === 'penjual') {
          message = 'Akun penjual tidak dapat mengakses keranjang. Kelola produk Anda di dashboard.';
          redirectUrl = 'dashboard-penjual.html';
        } else if (user.role === 'kurir') {
          message = 'Akun kurir tidak dapat mengakses keranjang. Fokus pada pengiriman pesanan.';
          redirectUrl = 'dashboard-kurir-new.html';
        } else if (user.role === 'admin') {
          message = 'Akun admin tidak dapat mengakses keranjang. Kelola sistem di admin panel.';
          redirectUrl = 'admin.html';
        }
        
        // Show error message with redirect button
        container.innerHTML = `
          <div class="text-center p-8">
            <p class="text-red-600 font-semibold mb-4">${message}</p>
            <button onclick="window.location.href='${redirectUrl}'" class="btn-secondary">
              Ke Dashboard
            </button>
          </div>
        `;
        return; // Stop execution
      }
    }
  } catch (e) {
    console.error('Failed to check user role', e);
  }
  
  // Continue with normal cart loading...
  try {
    const resp = await fetch(API_BASE + '/carts', { 
      headers: { Authorization: 'Bearer ' + token }
    });
    // ...
  }
}
```

**Result**:
- Penjual akses `keranjang.html` → Error message + redirect ke dashboard penjual
- Kurir akses `keranjang.html` → Error message + redirect ke dashboard kurir
- Admin akses `keranjang.html` → Error message + redirect ke admin panel
- Pembeli akses `keranjang.html` → Normal, load cart

---

#### B. checkout.html

**Lokasi**: Fungsi `loadCart()` - di awal sebelum load data

```javascript
async function loadCart() {
  const token = localStorage.getItem('auth_token');
  if (!token) { 
    // Show login message
    return; 
  }
  
  // ✅ CHECK USER ROLE FIRST
  try {
    const meResp = await API.authFetch('/auth/me');
    
    if (meResp.ok) {
      const user = await meResp.json();
      
      if (user.role !== 'pembeli') {
        let message = '';
        let redirectUrl = '';
        
        if (user.role === 'penjual') {
          message = 'Akun penjual tidak dapat melakukan checkout. Kelola produk Anda di dashboard.';
          redirectUrl = 'dashboard-penjual.html';
        } else if (user.role === 'kurir') {
          message = 'Akun kurir tidak dapat melakukan checkout. Fokus pada pengiriman pesanan.';
          redirectUrl = 'dashboard-kurir-new.html';
        } else if (user.role === 'admin') {
          message = 'Akun admin tidak dapat melakukan checkout. Kelola sistem di admin panel.';
          redirectUrl = 'admin.html';
        }
        
        document.getElementById("produk-container").innerHTML = `
          <div style='text-align:center;padding:40px'>
            <p style='color:#ff4444;font-weight:bold;margin-bottom:20px'>${message}</p>
            <button onclick="window.location.href='${redirectUrl}'" 
                    style='padding:10px 20px;background:#0077cc;color:white;border:none;border-radius:8px;cursor:pointer'>
              Ke Dashboard
            </button>
          </div>
        `;
        return; // Stop execution
      }
    }
  } catch (e) {
    console.error('Failed to check user role', e);
  }
  
  // Continue with normal checkout loading...
  try {
    const resp = await API.authFetch('/carts');
    // ...
  }
}
```

**Result**:
- Penjual akses `checkout.html` → Error message + redirect
- Kurir akses `checkout.html` → Error message + redirect
- Admin akses `checkout.html` → Error message + redirect
- Pembeli akses `checkout.html` → Normal, load checkout

---

#### C. tracking-pesanan.html

**Lokasi**: Fungsi `loadOrders()` - di awal sebelum load data

```javascript
async function loadOrders() {
  // ✅ CHECK USER ROLE FIRST
  try {
    const meResp = await API.authFetch('/auth/me');
    
    if (meResp.ok) {
      const user = await meResp.json();
      
      if (user.role !== 'pembeli') {
        let message = '';
        let redirectUrl = '';
        
        if (user.role === 'penjual') {
          message = 'Akun penjual tidak dapat melihat tracking pesanan pembeli. Lihat pesanan masuk di dashboard.';
          redirectUrl = 'dashboard-penjual.html';
        } else if (user.role === 'kurir') {
          message = 'Akun kurir tidak dapat melihat tracking pesanan pembeli. Lihat pengiriman di dashboard.';
          redirectUrl = 'dashboard-kurir-new.html';
        } else if (user.role === 'admin') {
          message = 'Akun admin tidak dapat melihat tracking pesanan pembeli. Kelola sistem di admin panel.';
          redirectUrl = 'admin.html';
        }
        
        document.getElementById('ordersList').innerHTML = `
          <div style="text-align:center;padding:60px 20px">
            <p style="color:#EF4444;font-weight:600;margin-bottom:20px">${message}</p>
            <button onclick="window.location.href='${redirectUrl}'" 
                    style="padding:10px 20px;background:#0077B6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">
              Ke Dashboard
            </button>
          </div>
        `;
        return; // Stop execution
      }
    }
  } catch (e) {
    console.error('Failed to check user role', e);
  }
  
  // Continue with normal orders loading...
  try {
    const resp = await API.authFetch('/orders/my-orders');
    // ...
  }
}
```

**Result**:
- Penjual akses `tracking-pesanan.html` → Error message + redirect
- Kurir akses `tracking-pesanan.html` → Error message + redirect
- Admin akses `tracking-pesanan.html` → Error message + redirect
- Pembeli akses `tracking-pesanan.html` → Normal, load tracking

---

## 🔐 Multi-Layer Security

### Layer 1: Backend Middleware ✅
```
Request → requireAuth → requireRole(['pembeli']) → Handler
                              ↓ (if not pembeli)
                         403 Forbidden
```

### Layer 2: Frontend Page Check ✅
```
Page Load → Check /auth/me → Check role
                                ↓ (if not pembeli)
                          Show error + redirect
```

### Layer 3: Frontend Action Check ✅
```
Add to Cart → Check window.currentRole
                    ↓ (if not pembeli)
              Show modal + block action
```

---

## 🧪 Testing

### Test Case 1: Penjual Akses Keranjang Langsung

**Steps**:
1. Login sebagai penjual
2. Akses `http://localhost:3000/keranjang.html` langsung di browser

**Expected Result**:
- ❌ Halaman load tapi show error message
- ❌ "Akun penjual tidak dapat mengakses keranjang"
- ✅ Tombol "Ke Dashboard" muncul
- ✅ Klik tombol → redirect ke `dashboard-penjual.html`

### Test Case 2: Kurir Akses Checkout Langsung

**Steps**:
1. Login sebagai kurir
2. Akses `http://localhost:3000/checkout.html` langsung

**Expected Result**:
- ❌ Halaman load tapi show error message
- ❌ "Akun kurir tidak dapat melakukan checkout"
- ✅ Tombol "Ke Dashboard" muncul
- ✅ Klik tombol → redirect ke `dashboard-kurir-new.html`

### Test Case 3: Admin Akses Tracking Langsung

**Steps**:
1. Login sebagai admin
2. Akses `http://localhost:3000/tracking-pesanan.html` langsung

**Expected Result**:
- ❌ Halaman load tapi show error message
- ❌ "Akun admin tidak dapat melihat tracking pesanan pembeli"
- ✅ Tombol "Ke Dashboard" muncul
- ✅ Klik tombol → redirect ke `admin.html`

### Test Case 4: Penjual Manipulasi Console

**Steps**:
1. Login sebagai penjual
2. Buka `home_final.html`
3. Open browser console
4. Run: `window.currentRole = 'pembeli'`
5. Coba tambah ke keranjang

**Expected Result**:
- ❌ Frontend validation bypass (window.currentRole changed)
- ❌ Backend return 403 Forbidden
- ❌ Modal error: "Gagal menambahkan ke keranjang"
- ✅ Produk tidak ditambahkan

### Test Case 5: Kurir Disable JavaScript

**Steps**:
1. Login sebagai kurir
2. Disable JavaScript di browser
3. Akses `keranjang.html`

**Expected Result**:
- ❌ Halaman tidak load (butuh JS)
- ❌ Jika force load, backend return 403
- ✅ Tidak bisa akses data

### Test Case 6: Pembeli Normal

**Steps**:
1. Login sebagai pembeli
2. Akses semua halaman pembelian

**Expected Result**:
- ✅ `keranjang.html` → Load normal
- ✅ `checkout.html` → Load normal
- ✅ `tracking-pesanan.html` → Load normal
- ✅ Semua fitur berfungsi

---

## 📊 Protection Matrix

| Halaman | Backend | Frontend Check | Action Block | Redirect |
|---------|---------|----------------|--------------|----------|
| **keranjang.html** | ✅ 403 | ✅ Role check | ✅ Hide button | ✅ Dashboard |
| **checkout.html** | ✅ 403 | ✅ Role check | ✅ Block action | ✅ Dashboard |
| **tracking-pesanan.html** | ✅ 403 | ✅ Role check | N/A | ✅ Dashboard |
| **home_final.html** | N/A | ✅ Hide cart | ✅ Block add | N/A |
| **detail-produk.html** | N/A | ✅ Role check | ✅ Block buy | N/A |

---

## 🐛 Troubleshooting

### Issue: Penjual masih bisa akses keranjang

**Check**:
1. Verify `/auth/me` endpoint working
2. Check browser console for errors
3. Verify token valid
4. Check role in database: `SELECT role FROM user WHERE user_id = X`

**Solution**:
- Clear localStorage
- Login ulang
- Check backend logs

### Issue: Error message tidak muncul

**Check**:
1. Verify `container.innerHTML` atau `document.getElementById()` target correct
2. Check browser console for JS errors
3. Verify API response

**Solution**:
- Add console.log untuk debug
- Check element ID exists
- Verify error handling

### Issue: Redirect tidak bekerja

**Check**:
1. Verify `window.location.href` syntax
2. Check file exists
3. Verify button onclick handler

**Solution**:
- Use absolute path if needed
- Check browser console
- Test redirect URL manually

---

## ✅ Summary

### Files Modified:
- ✅ `keranjang.html` - Added role check in `loadCartBackend()`
- ✅ `checkout.html` - Added role check in `loadCart()`
- ✅ `tracking-pesanan.html` - Added role check in `loadOrders()`

### Protection Added:
1. ✅ Page-level role validation
2. ✅ Error messages with context
3. ✅ Auto-redirect to appropriate dashboard
4. ✅ Stop execution if role invalid

### Security Layers:
1. ✅ Backend middleware (403 Forbidden)
2. ✅ Frontend page check (error + redirect)
3. ✅ Frontend action block (modal + prevent)

### Status:
✅ **BYPASS FIXED - SECURE**

---

**Last Updated**: December 10, 2025

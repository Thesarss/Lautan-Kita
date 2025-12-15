# Troubleshooting: Masalah Penghapusan Produk

## 🐛 **MASALAH**
Produk nonaktif tidak bisa dihapus dari dashboard penjual, muncul pesan "gagal".

## 🔍 **LANGKAH DEBUGGING**

### **1. Jalankan Script Debug**
```bash
cd backend
node debug-product-deletion.js
```

### **2. Test Penghapusan Langsung**
```bash
cd backend
node test-product-deletion-direct.js
```

### **3. Cek Log Server**
Setelah menjalankan perbaikan, coba hapus produk lagi dan lihat log di terminal server. Sekarang akan muncul log detail seperti:
```
Delete product request: productId=123, userId=1, userRole=penjual
Product ownership check result: [{ produk_id: 123, photo_url: null, status: 'nonaktif' }]
Product status: nonaktif
Product is inactive, skipping pending orders check
Deleting related cart items...
Deleted 0 cart items
Deleting product from database...
Delete result: 1 rows affected
Product 123 deleted successfully
```

## 🔧 **PERBAIKAN YANG SUDAH DITERAPKAN**

### **A. Perbaikan Logika Backend**
1. ✅ **Produk nonaktif bisa dihapus** tanpa cek pesanan pending
2. ✅ **Hapus cart items dulu** untuk menghindari foreign key constraint
3. ✅ **Logging detail** untuk debugging
4. ✅ **Error handling** yang lebih spesifik

### **B. Perbaikan Query**
- Menggabungkan query ownership dan status check
- Menghapus cart items sebelum menghapus produk
- Menambahkan validasi rows affected

## 🧪 **CARA TESTING**

### **1. Persiapan Test**
1. Login sebagai penjual
2. Pastikan ada produk dengan status 'nonaktif'
3. Buka dashboard penjual

### **2. Test Penghapusan**
1. Klik tombol "Hapus" pada produk nonaktif
2. Konfirmasi penghapusan
3. Lihat hasilnya

### **3. Cek Browser Console**
Buka Developer Tools (F12) → Console, lihat apakah ada error JavaScript.

### **4. Cek Network Tab**
Buka Developer Tools → Network → coba hapus produk → lihat response API.

## 🚨 **KEMUNGKINAN MASALAH & SOLUSI**

### **Masalah 1: Error 404 - Product Not Found**
**Penyebab:** Produk tidak ditemukan atau bukan milik user yang login
**Solusi:**
```bash
# Cek ownership produk
node -e "
const { pool } = require('./src/db');
pool.getConnection().then(async conn => {
  const [result] = await conn.query('SELECT produk_id, penjual_id, status FROM produk WHERE produk_id = ?', [PRODUCT_ID]);
  console.table(result);
  conn.release();
  process.exit(0);
});
"
```

### **Masalah 2: Error 409 - Product in Pending Orders**
**Penyebab:** Produk aktif masih ada pesanan pending
**Solusi:** Ubah status produk ke 'nonaktif' dulu, baru hapus

### **Masalah 3: Error 500 - Internal Server Error**
**Penyebab:** Foreign key constraint atau database error
**Solusi:**
```bash
# Jalankan script pembersihan
node fix-seller-data.js
```

### **Masalah 4: Frontend Error - Network/JavaScript**
**Penyebab:** Masalah koneksi atau JavaScript error
**Solusi:**
1. Cek apakah server berjalan di port 4000
2. Cek browser console untuk error
3. Cek apakah token auth masih valid

## 📋 **CHECKLIST DEBUGGING**

### **Backend Checks:**
- [ ] Server berjalan di port 4000
- [ ] Database connection OK
- [ ] User login sebagai penjual
- [ ] Produk ada dan milik user
- [ ] Tidak ada foreign key constraint

### **Frontend Checks:**
- [ ] Browser console tidak ada error
- [ ] Network request berhasil dikirim
- [ ] Response dari server diterima
- [ ] Token authentication valid

### **Database Checks:**
- [ ] Produk exists di database
- [ ] Status produk = 'nonaktif'
- [ ] Tidak ada cart items yang reference produk
- [ ] Tidak ada pesanan pending (untuk produk aktif)

## 🛠️ **MANUAL TESTING**

### **Test dengan cURL:**
```bash
# Get auth token first (login)
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"password123"}'

# Use the token to delete product
curl -X DELETE http://localhost:4000/penjual/produk/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Test dengan Postman:**
1. POST `/auth/login` dengan credentials penjual
2. Copy token dari response
3. DELETE `/penjual/produk/{id}` dengan Bearer token
4. Lihat response dan status code

## 📊 **EXPECTED RESULTS**

### **Successful Deletion:**
```json
{
  "ok": true,
  "message": "Produk berhasil dihapus"
}
```

### **Error Responses:**
```json
// Product not found
{
  "error": "not_found",
  "message": "Produk tidak ditemukan atau bukan milik Anda"
}

// Active product with pending orders
{
  "error": "product_in_pending_orders",
  "message": "Tidak dapat menghapus produk aktif karena masih ada 2 pesanan aktif...",
  "pending_count": 2
}

// Database error
{
  "error": "internal_error",
  "message": "Tidak dapat menghapus produk karena masih ada data terkait di sistem"
}
```

## 🔄 **JIKA MASIH BERMASALAH**

### **1. Reset Database State**
```bash
# Backup dulu
mysqldump -u root -p toko_online > backup.sql

# Jalankan cleanup
node fix-seller-data.js

# Restart server
npm restart
```

### **2. Create Fresh Test Data**
```bash
# Buat produk test nonaktif
node -e "
const { pool } = require('./src/db');
pool.getConnection().then(async conn => {
  const [result] = await conn.query(
    'INSERT INTO produk (penjual_id, nama_produk, harga, stok, status) VALUES (1, \"Test Hapus\", 10000, 0, \"nonaktif\")'
  );
  console.log('Created test product ID:', result.insertId);
  conn.release();
  process.exit(0);
});
"
```

### **3. Manual Database Cleanup**
```sql
-- Hapus cart items yang reference produk nonaktif
DELETE ki FROM keranjang_item ki 
JOIN produk p ON p.produk_id = ki.produk_id 
WHERE p.status = 'nonaktif';

-- Hapus produk nonaktif secara manual
DELETE FROM produk WHERE status = 'nonaktif' AND produk_id = YOUR_PRODUCT_ID;
```

## 📞 **SUPPORT**

Jika masih bermasalah setelah mengikuti semua langkah:

1. **Jalankan full debug:**
   ```bash
   node debug-product-deletion.js
   node test-product-deletion-direct.js
   ```

2. **Kirim log output** dari kedua script di atas

3. **Sertakan:**
   - Browser console errors
   - Network tab response
   - Server terminal logs
   - Database state (hasil query produk)

---

**Status:** 🔧 **DIPERBAIKI**  
**Last Updated:** 12 Desember 2024  
**Version:** 2.0
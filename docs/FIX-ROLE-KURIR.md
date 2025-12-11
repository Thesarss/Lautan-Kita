# 🔧 Fix: Role Kurir Tidak Bisa Register

## 🐛 Masalah

Role 'kurir' tidak bisa register karena database schema hanya mendefinisikan enum role: `'pembeli','penjual','admin'` - **tidak ada 'kurir'**.

## ✅ Solusi

Ada **3 cara** untuk memperbaiki masalah ini:

---

## 🚀 Cara 1: Auto-Update (RECOMMENDED)

Backend sekarang sudah diupdate untuk **otomatis menambahkan role 'kurir'** saat startup.

### Langkah-langkah:

1. **Stop backend** (jika sedang running):
   ```bash
   Ctrl + C
   ```

2. **Start backend lagi**:
   ```bash
   cd backend
   npm start
   ```

3. **Lihat log console**:
   ```
   Database connected
   Updated user.role enum to include kurir
   Server listening on 4000
   ```

4. **Test registrasi kurir**:
   - Buka: `http://localhost:3000/registrasi.html`
   - Pilih role: **Kurir**
   - Isi data dan daftar
   - Seharusnya berhasil! ✅

---

## 🔧 Cara 2: Manual via SQL (Jika Auto-Update Gagal)

### Langkah-langkah:

1. **Buka phpMyAdmin**:
   ```
   http://localhost/phpmyadmin
   ```

2. **Pilih database `toko_online`**

3. **Klik tab "SQL"**

4. **Jalankan query ini**:
   ```sql
   ALTER TABLE `user` 
   MODIFY COLUMN `role` ENUM('pembeli', 'penjual', 'admin', 'kurir') 
   DEFAULT 'pembeli';
   ```

5. **Klik "Go"**

6. **Verifikasi**:
   ```sql
   DESCRIBE `user`;
   ```
   
   Kolom `role` seharusnya menampilkan:
   ```
   enum('pembeli','penjual','admin','kurir')
   ```

7. **Test registrasi kurir** di `registrasi.html`

---

## 📝 Cara 3: Via File SQL

### Langkah-langkah:

1. **Buka file**:
   ```
   backend/update-schema-kurir.sql
   ```

2. **Copy semua isi file**

3. **Buka phpMyAdmin** → Database `toko_online` → Tab "SQL"

4. **Paste dan jalankan**

5. **Test registrasi kurir**

---

## 🧪 Testing

### Test via Script:

```bash
node backend/test-register-kurir.js
```

**Output yang diharapkan:**
```
🧪 Testing registrasi kurir...

📤 Mengirim request registrasi...
Data: {
  "nama": "Joko Kurir",
  "email": "kurir.test@lautankita.com",
  "password": "Kurir12345",
  "role": "kurir"
}

📥 Response Status: 200
Response Data: {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

✅ Registrasi BERHASIL!
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔍 Testing GET /auth/me...
User Data: {
  "id": 5,
  "nama": "Joko Kurir",
  "email": "kurir.test@lautankita.com",
  "role": "kurir",
  "verified": 0
}

✅ Role kurir TERIDENTIFIKASI dengan benar!
```

### Test via Web:

1. **Buka**: `http://localhost:3000/registrasi.html`

2. **Isi form**:
   - Nama: Joko Kurir
   - Email: kurir@test.com
   - Password: Kurir12345
   - Role: **Kurir** ← Pilih ini

3. **Klik "Daftar"**

4. **Seharusnya berhasil dan redirect ke beranda**

5. **Klik menu profil** → Lihat role: "kurir"

6. **Klik "Dashboard"** → Redirect ke `dashboard-kurir.html`

---

## 🔍 Verifikasi

### Via Database:

```sql
-- Cek enum role
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'toko_online' 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME = 'role';

-- Expected: enum('pembeli','penjual','admin','kurir')

-- Cek user dengan role kurir
SELECT user_id, nama, email, role 
FROM user 
WHERE role = 'kurir';
```

### Via API:

```bash
# Register kurir
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Test Kurir",
    "email": "test.kurir@example.com",
    "password": "Kurir12345",
    "role": "kurir"
  }'

# Response:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# Get user info
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response:
# {"id":5,"nama":"Test Kurir","email":"test.kurir@example.com","role":"kurir","verified":0}
```

---

## 📋 Checklist

Setelah fix, pastikan semua ini berfungsi:

- [ ] Backend start tanpa error
- [ ] Log menampilkan: "Updated user.role enum to include kurir"
- [ ] Registrasi kurir via web berhasil
- [ ] Login kurir berhasil
- [ ] Dashboard kurir bisa diakses
- [ ] Role kurir teridentifikasi di `/auth/me`
- [ ] Kurir hanya bisa lihat alamat (tidak ada detail produk/harga)

---

## 🐛 Troubleshooting

### Error: "Data truncated for column 'role'"

**Penyebab:** Database belum diupdate

**Solusi:**
1. Restart backend (auto-update akan jalan)
2. Atau jalankan SQL manual (Cara 2)

### Error: "validation_error"

**Penyebab:** Backend validation belum include 'kurir'

**Solusi:**
1. Cek `backend/src/routes/auth.js` line 18:
   ```javascript
   body('role').isIn(['pembeli', 'penjual', 'kurir'])
   ```
2. Pastikan 'kurir' ada di array

### Backend tidak auto-update

**Penyebab:** Error saat koneksi database

**Solusi:**
1. Cek log backend untuk error
2. Pastikan MySQL running
3. Cek kredensial di `.env`
4. Jalankan SQL manual (Cara 2)

### Registrasi berhasil tapi role jadi 'pembeli'

**Penyebab:** Database enum belum diupdate

**Solusi:**
1. Jalankan SQL manual:
   ```sql
   ALTER TABLE user MODIFY COLUMN role ENUM('pembeli','penjual','admin','kurir') DEFAULT 'pembeli';
   ```
2. Hapus user yang salah:
   ```sql
   DELETE FROM user WHERE email = 'kurir@test.com';
   ```
3. Register ulang

---

## 📊 Perubahan File

### File yang Diupdate:

1. **`toko_online.sql`**
   - Line 167: Tambah 'kurir' ke enum role
   ```sql
   `role` enum('pembeli','penjual','admin','kurir') DEFAULT 'pembeli',
   ```

2. **`backend/src/app.js`**
   - Tambah auto-update schema saat startup
   ```javascript
   // Ensure role enum includes 'kurir'
   const [roleEnum] = await conn2.query("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'role'");
   if (roleEnum.length && !roleEnum[0].COLUMN_TYPE.includes('kurir')) {
     await conn2.query("ALTER TABLE user MODIFY COLUMN role ENUM('pembeli','penjual','admin','kurir') DEFAULT 'pembeli'");
     console.log('Updated user.role enum to include kurir');
   }
   ```

3. **`backend/src/routes/auth.js`**
   - Sudah benar, validation include 'kurir'
   ```javascript
   body('role').isIn(['pembeli', 'penjual', 'kurir'])
   ```

### File Baru:

1. **`backend/update-schema-kurir.sql`** - SQL manual untuk update schema
2. **`backend/test-register-kurir.js`** - Script test registrasi kurir
3. **`FIX-ROLE-KURIR.md`** - Dokumentasi fix ini

---

## ✅ Kesimpulan

Masalah sudah diperbaiki dengan 3 cara:
1. ✅ Auto-update saat backend start (RECOMMENDED)
2. ✅ Manual via SQL
3. ✅ Via file SQL

Sekarang role 'kurir' sudah bisa register dan teridentifikasi dengan benar!

---

**Last Updated:** 2025-12-09
**Version:** 1.0.1

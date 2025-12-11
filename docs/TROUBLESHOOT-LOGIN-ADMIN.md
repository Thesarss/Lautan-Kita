# 🔧 Troubleshooting: Tidak Bisa Login Sebagai Admin

## 🐛 Kemungkinan Masalah

Ada beberapa kemungkinan kenapa tidak bisa login sebagai admin:

1. ❌ Admin belum dibuat di database
2. ❌ Password salah
3. ❌ Email salah
4. ❌ Password hash corrupt
5. ❌ Backend tidak running
6. ❌ Token tidak tersimpan

---

## 🔍 Langkah 1: Cek Apakah Admin Sudah Ada

### Via Script (RECOMMENDED):

```bash
node backend/check-admin.js
```

**Output yang diharapkan:**
```
✅ Ditemukan 1 admin:

Admin #1:
  User ID    : 1
  Nama       : Administrator
  Email      : admin@lautankita.com
  Role       : admin
  Verified   : Ya
  Created    : 2025-12-09 10:30:00

🔐 Testing password untuk admin pertama...
✅ Password COCOK: "Admin123456"

📋 Kredensial Login:
Email    : admin@lautankita.com
Password : Admin123456
```

### Via Database (phpMyAdmin):

1. Buka: `http://localhost/phpmyadmin`
2. Pilih database: `toko_online`
3. Klik tabel: `user`
4. Jalankan query:
   ```sql
   SELECT user_id, nama, email, role, verified 
   FROM user 
   WHERE role = 'admin';
   ```

**Jika TIDAK ADA hasil:**
- Admin belum dibuat → Lanjut ke Langkah 2

**Jika ADA hasil:**
- Admin sudah ada → Lanjut ke Langkah 3

---

## 🔧 Langkah 2: Buat Admin (Jika Belum Ada)

### Cara 1: Via Script Force (PALING MUDAH)

```bash
node backend/create-admin-force.js
```

Script ini akan:
- ✅ Cek apakah admin sudah ada
- ✅ Hapus admin lama jika ada (dengan konfirmasi)
- ✅ Buat admin baru
- ✅ Test password hash
- ✅ Tampilkan kredensial

**Ikuti instruksi di layar:**
```
Gunakan kredensial custom? (y/n, default: n): n
Lanjutkan? (y/n): y

✅ Akun admin berhasil dibuat!

Email    : admin@lautankita.com
Password : Admin123456
```

### Cara 2: Via Script Biasa

```bash
node backend/create-admin.js
```

### Cara 3: Via Web

1. Buka: `http://localhost:3000/registrasi-admin.html`
2. Isi form:
   - Nama: Administrator
   - Email: admin@lautankita.com
   - Password: Admin123456
   - Konfirmasi Password: Admin123456
   - Secret Key: `LAUTAN_KITA_ADMIN_2025`
3. Klik "Buat Akun Admin"

### Cara 4: Via SQL Manual

```sql
-- Hash password: Admin123456
-- Gunakan bcrypt online: https://bcrypt-generator.com/
-- Atau generate via Node.js (lihat di bawah)

INSERT INTO user (nama, email, password_hash, role, verified, created_at)
VALUES (
  'Administrator',
  'admin@lautankita.com',
  '$2b$10$rQZ5YvU5YvU5YvU5YvU5YeXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'admin',
  1,
  NOW()
);
```

**Generate password hash:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin123456', 10, (err, hash) => console.log(hash));"
```

---

## 🔐 Langkah 3: Test Login

### Via Web:

1. **Buka**: `http://localhost:3000/login.html`

2. **Isi form**:
   - Email: `admin@lautankita.com`
   - Password: `Admin123456`

3. **Klik "Masuk"**

4. **Cek hasil**:
   - ✅ Berhasil → Redirect ke beranda
   - ❌ Gagal → Lihat error di console (F12)

### Via API (curl):

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lautankita.com","password":"Admin123456"}'
```

**Response berhasil:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response gagal:**
```json
{
  "error": "invalid_credentials"
}
```

### Via Browser Console:

1. Buka: `http://localhost:3000/login.html`
2. Tekan F12 → Console
3. Paste dan jalankan:

```javascript
fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@lautankita.com',
    password: 'Admin123456'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    console.log('✅ Login berhasil! Token tersimpan.');
    console.log('Refresh halaman atau klik Dashboard');
  } else {
    console.log('❌ Login gagal:', data.error);
  }
});
```

---

## 🐛 Troubleshooting Spesifik

### Error: "invalid_credentials"

**Kemungkinan:**
1. Email salah
2. Password salah
3. Password hash corrupt

**Solusi:**

1. **Cek email di database:**
   ```sql
   SELECT email FROM user WHERE role = 'admin';
   ```

2. **Reset password:**
   ```bash
   node backend/create-admin-force.js
   ```
   Pilih "y" untuk hapus dan buat baru

3. **Atau update password manual:**
   ```sql
   -- Generate hash baru untuk password: Admin123456
   UPDATE user 
   SET password_hash = '$2b$10$NEW_HASH_HERE'
   WHERE email = 'admin@lautankita.com';
   ```

### Error: "db_unavailable"

**Kemungkinan:**
- Database tidak terhubung
- MySQL tidak running

**Solusi:**
1. Start XAMPP MySQL
2. Cek kredensial di `backend/.env`:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=toko_online
   ```
3. Test koneksi:
   ```bash
   node backend/check-admin.js
   ```

### Error: "email_exists" (saat registrasi)

**Kemungkinan:**
- Admin sudah ada tapi password lupa

**Solusi:**
1. Gunakan script force:
   ```bash
   node backend/create-admin-force.js
   ```
2. Pilih "y" untuk hapus user lama

### Login berhasil tapi tidak redirect ke dashboard

**Kemungkinan:**
- Token tidak tersimpan
- Role tidak terdeteksi

**Solusi:**

1. **Cek token di localStorage:**
   - F12 → Application → Local Storage
   - Cari key: `auth_token`
   - Jika tidak ada → Login ulang

2. **Cek role:**
   ```javascript
   // Di console browser
   fetch('http://localhost:4000/auth/me', {
     headers: { 
       'Authorization': 'Bearer ' + localStorage.getItem('auth_token') 
     }
   })
   .then(r => r.json())
   .then(data => console.log('User:', data));
   ```

3. **Manual redirect:**
   ```javascript
   window.location.href = 'admin.html';
   ```

### Backend tidak running

**Cek:**
```bash
curl http://localhost:4000/products
```

**Jika error:**
```bash
cd backend
npm start
```

---

## 📋 Checklist Lengkap

Pastikan semua ini sudah dilakukan:

- [ ] MySQL/XAMPP running
- [ ] Database `toko_online` sudah dibuat
- [ ] Tabel `user` sudah ada
- [ ] Backend running di port 4000
- [ ] Admin sudah dibuat (cek via `check-admin.js`)
- [ ] Password benar: `Admin123456`
- [ ] Email benar: `admin@lautankita.com`
- [ ] Browser tidak block cookies/localStorage
- [ ] CORS tidak error (cek console F12)

---

## 🚀 Quick Fix (All-in-One)

Jika masih bingung, jalankan ini:

```bash
# 1. Cek admin
node backend/check-admin.js

# 2. Jika tidak ada atau password salah, buat baru
node backend/create-admin-force.js

# 3. Test login via curl
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lautankita.com","password":"Admin123456"}'

# 4. Jika berhasil, buka browser dan login
```

---

## 📞 Masih Gagal?

Jika masih tidak bisa login setelah semua langkah di atas:

1. **Kirim output dari:**
   ```bash
   node backend/check-admin.js
   ```

2. **Screenshot error** di browser console (F12)

3. **Cek log backend** di terminal

4. **Pastikan versi Node.js:**
   ```bash
   node --version  # Minimal v14
   ```

5. **Reinstall dependencies:**
   ```bash
   cd backend
   rm -rf node_modules
   npm install
   npm start
   ```

---

## ✅ Kredensial Default

Setelah berhasil membuat admin:

```
Email    : admin@lautankita.com
Password : Admin123456
URL Login: http://localhost:3000/login.html
```

⚠️ **PENTING:** Ganti password setelah login pertama!

---

**Last Updated:** 2025-12-09
**Version:** 1.0.0

# 🔐 Cara Membuat Akun Admin - Lautan Kita

## 📋 Overview

Ada **3 cara** untuk membuat akun admin di sistem Lautan Kita:

1. **Via Script Node.js** (Paling Mudah)
2. **Via Halaman Web** (registrasi-admin.html)
3. **Via Database Manual** (MySQL)

---

## ✅ Metode 1: Via Script Node.js (RECOMMENDED)

### Langkah-langkah:

1. **Pastikan Backend Running:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Jalankan Script Create Admin:**
   
   Buka terminal baru, lalu jalankan:
   ```bash
   node backend/create-admin.js
   ```

3. **Output yang Diharapkan:**
   ```
   🔧 Membuat akun admin...
   
   ✅ Terhubung ke database
   
   ✅ Akun admin berhasil dibuat!
   
   📋 Detail Akun:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   User ID    : 1
   Nama       : Administrator
   Email      : admin@lautankita.com
   Password   : Admin123456
   Role       : admin
   Verified   : Ya
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ⚠️  PENTING:
   1. Simpan kredensial ini dengan aman
   2. Segera ganti password setelah login pertama
   3. Jangan share kredensial ini ke siapapun
   
   🚀 Silakan login di: http://localhost:3000/login.html
   ```

4. **Login:**
   - Buka: `http://localhost:3000/login.html`
   - Email: `admin@lautankita.com`
   - Password: `Admin123456`

### Kustomisasi:

Edit file `backend/create-admin.js` untuk mengubah data admin:

```javascript
const adminData = {
  nama: 'Administrator',           // Ubah nama
  email: 'admin@lautankita.com',   // Ubah email
  password: 'Admin123456',         // Ubah password
  role: 'admin'
};
```

---

## ✅ Metode 2: Via Halaman Web

### Langkah-langkah:

1. **Pastikan Backend Running:**
   ```bash
   cd backend
   npm start
   ```

2. **Buka Halaman Registrasi Admin:**
   ```
   http://localhost:3000/registrasi-admin.html
   ```

3. **Isi Form:**
   - **Nama Lengkap:** Administrator
   - **Email:** admin@lautankita.com
   - **Password:** Admin123456 (minimal 8 karakter)
   - **Konfirmasi Password:** Admin123456
   - **Secret Key:** `LAUTAN_KITA_ADMIN_2025`

4. **Klik "Buat Akun Admin"**

5. **Login:**
   - Otomatis redirect ke dashboard admin
   - Atau login manual di `login.html`

### Secret Key:

Secret key default: `LAUTAN_KITA_ADMIN_2025`

Untuk mengubah secret key, edit file `backend/.env`:
```env
ADMIN_SECRET_KEY=YOUR_CUSTOM_SECRET_KEY_HERE
```

### Catatan Penting:

- ⚠️ Halaman ini **hanya bisa digunakan sekali**
- Setelah admin pertama dibuat, endpoint akan menolak registrasi admin baru
- Admin baru harus dibuat oleh admin yang sudah ada

---

## ✅ Metode 3: Via Database Manual (MySQL)

### Langkah-langkah:

1. **Buka phpMyAdmin atau MySQL Client:**
   ```
   http://localhost/phpmyadmin
   ```

2. **Pilih Database `toko_online`**

3. **Jalankan Query SQL:**

   ```sql
   -- Hash password menggunakan bcrypt (10 rounds)
   -- Password: Admin123456
   -- Hash: $2b$10$YourHashedPasswordHere
   
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

4. **Generate Password Hash:**

   Gunakan Node.js untuk generate hash:
   ```javascript
   const bcrypt = require('bcrypt');
   const password = 'Admin123456';
   bcrypt.hash(password, 10, (err, hash) => {
     console.log('Hash:', hash);
   });
   ```

   Atau gunakan online tool: https://bcrypt-generator.com/

5. **Login:**
   - Email: `admin@lautankita.com`
   - Password: `Admin123456`

---

## 🔒 Keamanan

### Secret Key:

Default secret key: `LAUTAN_KITA_ADMIN_2025`

**Untuk Production:**

1. Edit `backend/.env`:
   ```env
   ADMIN_SECRET_KEY=YOUR_VERY_SECURE_RANDOM_KEY_HERE_2025
   ```

2. Generate random key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Password Policy:

- Minimal 8 karakter
- Kombinasi huruf besar, kecil, angka
- Ganti password default setelah login pertama

### Best Practices:

1. ✅ Gunakan email yang valid dan aman
2. ✅ Password minimal 12 karakter untuk production
3. ✅ Aktifkan 2FA (jika tersedia)
4. ✅ Jangan share kredensial admin
5. ✅ Ganti secret key untuk production
6. ✅ Backup database secara berkala

---

## 🐛 Troubleshooting

### Error: "admin_already_exists"

**Penyebab:** Admin sudah pernah dibuat

**Solusi:**
1. Login dengan akun admin yang sudah ada
2. Atau hapus admin lama dari database:
   ```sql
   DELETE FROM user WHERE role = 'admin' AND email = 'admin@lautankita.com';
   ```

### Error: "invalid_secret_key"

**Penyebab:** Secret key salah

**Solusi:**
1. Cek secret key di `backend/.env`
2. Gunakan default: `LAUTAN_KITA_ADMIN_2025`
3. Atau ubah di file `.env`

### Error: "db_unavailable"

**Penyebab:** Database tidak terhubung

**Solusi:**
1. Pastikan MySQL/XAMPP running
2. Cek konfigurasi di `backend/.env`:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=toko_online
   ```
3. Import `toko_online.sql` jika belum

### Error: "email_exists"

**Penyebab:** Email sudah terdaftar

**Solusi:**
1. Gunakan email lain
2. Atau hapus user dengan email tersebut:
   ```sql
   DELETE FROM user WHERE email = 'admin@lautankita.com';
   ```

---

## 📊 Verifikasi Admin Berhasil Dibuat

### Via Database:

```sql
SELECT user_id, nama, email, role, verified, created_at 
FROM user 
WHERE role = 'admin';
```

### Via API:

```bash
# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lautankita.com","password":"Admin123456"}'

# Response:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# Get User Info
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response:
# {"id":1,"nama":"Administrator","email":"admin@lautankita.com","role":"admin","verified":1}
```

### Via Web:

1. Login di `login.html`
2. Klik menu profil
3. Klik "Dashboard"
4. Harus redirect ke `admin.html`

---

## 🎯 Setelah Admin Dibuat

### Langkah Selanjutnya:

1. **Ganti Password:**
   - Login ke dashboard admin
   - Klik profil
   - Ubah password

2. **Buat User Lain:**
   - Pembeli: via `registrasi.html`
   - Penjual: via `registrasi.html`
   - Kurir: via `registrasi.html`
   - Admin baru: via dashboard admin (ubah role user)

3. **Kelola Sistem:**
   - Verifikasi user
   - Moderasi ulasan
   - Kelola pesanan
   - Lihat statistik

---

## 📞 Support

Jika masih ada masalah, hubungi tim development atau buat issue di repository.

---

**Last Updated:** 2025-12-09
**Version:** 1.0.0

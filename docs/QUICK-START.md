# 🚀 Quick Start - Lautan Kita

## 📦 Instalasi & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd lautan-kita
```

### 2. Setup Database (XAMPP)

1. **Start XAMPP:**
   - Jalankan MySQL di XAMPP Control Panel

2. **Import Database:**
   - Buka phpMyAdmin: `http://localhost/phpmyadmin`
   - Buat database baru: `toko_online`
   - Import file: `toko_online.sql`

### 3. Setup Backend

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Konfigurasi Environment:**
   
   Copy `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```

   Edit `backend/.env`:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=toko_online
   JWT_SECRET=your_jwt_secret_key_here
   ADMIN_SECRET_KEY=LAUTAN_KITA_ADMIN_2025
   ```

3. **Start Backend:**
   ```bash
   npm start
   ```
   
   Backend akan running di: `http://localhost:4000`

### 4. Setup Frontend

1. **Buka dengan Live Server:**
   - Install VS Code extension: "Live Server"
   - Right-click `home_final.html`
   - Pilih "Open with Live Server"

2. **Atau buka langsung:**
   ```
   http://localhost:3000/home_final.html
   ```

---

## 👤 Membuat Akun Admin

### Cara Tercepat (Via Script):

```bash
node backend/create-admin.js
```

**Output:**
```
✅ Akun admin berhasil dibuat!

Email    : admin@lautankita.com
Password : Admin123456
```

### Cara Alternatif (Via Web):

1. Buka: `http://localhost:3000/registrasi-admin.html`
2. Isi form dengan secret key: `LAUTAN_KITA_ADMIN_2025`
3. Klik "Buat Akun Admin"

**Detail lengkap:** Lihat `CARA-MEMBUAT-ADMIN.md`

---

## 🎭 Membuat Akun Test

### Via Registrasi Web:

1. **Buka:** `http://localhost:3000/registrasi.html`

2. **Buat Akun Pembeli:**
   - Nama: Budi Pembeli
   - Email: pembeli@test.com
   - Password: Pembeli123
   - Role: Pembeli

3. **Buat Akun Penjual:**
   - Nama: Susi Penjual
   - Email: penjual@test.com
   - Password: Penjual123
   - Role: Nelayan / Penjual

4. **Buat Akun Kurir:**
   - Nama: Joko Kurir
   - Email: kurir@test.com
   - Password: Kurir12345
   - Role: Kurir

---

## 🔐 Login

### Admin:
```
Email    : admin@lautankita.com
Password : Admin123456
```

### Test Accounts:
```
Pembeli  : pembeli@test.com / Pembeli123
Penjual  : penjual@test.com / Penjual123
Kurir    : kurir@test.com / Kurir12345
```

**Login URL:** `http://localhost:3000/login.html`

---

## 📱 Akses Dashboard

Setelah login, klik menu profil → **Dashboard**

Atau akses langsung: `http://localhost:3000/dashboard.html`

**Dashboard akan otomatis redirect sesuai role:**
- Pembeli → `dashboard-pembeli.html`
- Penjual → `dashboard-penjual.html`
- Kurir → `dashboard-kurir.html`
- Admin → `admin.html`

---

## 🧪 Testing Flow

### 1. Test Sebagai Penjual:

1. Login sebagai penjual
2. Klik Dashboard
3. Tambah produk baru:
   - Nama: Ikan Segar
   - Harga: 50000
   - Stok: 10
   - Upload foto (opsional)
4. Klik "Simpan"
5. Produk akan muncul di beranda

### 2. Test Sebagai Pembeli:

1. Login sebagai pembeli
2. Buka beranda
3. Klik "Tambah ke Keranjang" pada produk
4. Klik icon keranjang
5. Klik "Pesan"
6. Pilih metode pembayaran
7. Klik "Checkout"
8. Konfirmasi pembayaran
9. Lihat pesanan di Dashboard

### 3. Test Sebagai Kurir:

1. Login sebagai kurir
2. Klik Dashboard
3. Lihat daftar pengiriman (HANYA alamat, tanpa detail produk)
4. Update status pengiriman
5. Input nomor resi
6. Tandai sebagai terkirim

### 4. Test Sebagai Admin:

1. Login sebagai admin
2. Klik Dashboard
3. Kelola user (ubah role, verify)
4. Kelola ulasan
5. Full access ke semua data

---

## 📚 Dokumentasi Lengkap

- **Dashboard System:** `DASHBOARD-SYSTEM-README.md`
- **Detail Produk:** `DETAIL-PRODUK-README.md`
- **Cara Membuat Admin:** `CARA-MEMBUAT-ADMIN.md`
- **README Utama:** `README.md`

---

## 🔧 Troubleshooting

### Backend tidak bisa start:

```bash
# Cek apakah port 4000 sudah digunakan
netstat -ano | findstr :4000

# Kill process jika perlu
taskkill /PID <PID> /F

# Atau ubah port di backend/src/app.js
```

### Database connection error:

1. Pastikan XAMPP MySQL running
2. Cek kredensial di `backend/.env`
3. Import `toko_online.sql` jika belum

### Frontend tidak bisa akses backend:

1. Cek backend running di `http://localhost:4000`
2. Cek CORS di `backend/src/app.js`
3. Clear browser cache

### Login gagal:

1. Cek email dan password
2. Cek token di localStorage (F12 → Application → Local Storage)
3. Cek response di Network tab (F12 → Network)

---

## 🎯 Fitur Utama

### ✅ Sudah Selesai:

- [x] Registrasi & Login (JWT)
- [x] Dashboard per Role (Pembeli, Penjual, Kurir, Admin)
- [x] Kelola Produk (CRUD dengan foto)
- [x] Keranjang Belanja
- [x] Checkout & Pembayaran
- [x] Tracking Pesanan
- [x] Upload Avatar & Foto Produk
- [x] Detail Produk Dinamis
- [x] Permission System (RBAC)
- [x] Kurir hanya lihat alamat (privasi)

### 🚧 Coming Soon:

- [ ] Real-time notification
- [ ] Chat pembeli-penjual
- [ ] Rating & review produk
- [ ] Export laporan
- [ ] Analytics dashboard
- [ ] Multi-language

---

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Cek dokumentasi di folder root
2. Lihat console browser (F12)
3. Cek log backend di terminal
4. Hubungi tim development

---

**Happy Coding! 🚀**

Last Updated: 2025-12-09

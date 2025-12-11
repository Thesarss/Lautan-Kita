# ✅ Akun Admin Siap Digunakan!

## 🔐 Kredensial Login Admin

```
Email    : admin@lautankita.com
Password : Admin123456
```

## 🚀 Cara Login

### Langkah 1: Buka Halaman Login
Buka file `login.html` di browser atau akses:
```
http://localhost:3000/login.html
```

### Langkah 2: Masukkan Kredensial
- **Email**: `admin@lautankita.com`
- **Password**: `Admin123456`

### Langkah 3: Klik "Masuk"
Setelah login berhasil, Anda akan diarahkan ke halaman beranda.

### Langkah 4: Akses Admin Panel
Ada 2 cara:
1. **Via Dashboard**: Klik icon profil → "Dashboard" → otomatis ke admin panel
2. **Direct**: Buka `admin.html` langsung

## 📊 Fitur Admin Panel

Setelah login sebagai admin, Anda bisa:

### 1. Dashboard
- Lihat statistik: Total Users, Products, Orders, Reviews
- Overview sistem

### 2. Kelola Pengguna
- Lihat semua user (pembeli, penjual, kurir, admin)
- Edit role user
- Lihat status verified

### 3. Kelola Produk
- Lihat semua produk dari semua penjual
- Moderasi produk (aktif/nonaktif)
- Edit detail produk

### 4. Kelola Pesanan
- Lihat semua transaksi
- Update status pesanan
- Monitor pembayaran

### 5. Moderasi Ulasan
- Review ulasan produk
- Approve/reject ulasan

## 🔍 Verifikasi Admin

Untuk memastikan admin sudah ada di database:
```bash
node backend/check-admin.js
```

Output yang benar:
```
✅ Ditemukan 1 admin:
  Email: admin@lautankita.com
  Password COCOK: "Admin123456"
```

## ⚠️ Troubleshooting

### Problem: "Email atau password salah"
**Solusi:**
1. Pastikan email: `admin@lautankita.com` (huruf kecil semua)
2. Pastikan password: `Admin123456` (case-sensitive)
3. Cek backend running di port 4000
4. Cek console browser untuk error

### Problem: "Akses ditolak"
**Solusi:**
1. Pastikan role di database adalah 'admin'
2. Jalankan: `node backend/check-admin.js`
3. Jika role bukan admin, jalankan: `node backend/create-admin-force.js`

### Problem: Backend tidak running
**Solusi:**
```bash
cd backend
npm start
```

Expected output:
```
Server listening on 4000
Database connected
```

## 🔄 Reset Admin (Jika Perlu)

Jika perlu reset admin (hapus admin lama dan buat baru):
```bash
node backend/create-admin-force.js
```

Ini akan:
1. Hapus semua admin lama
2. Buat admin baru dengan kredensial default
3. Verifikasi password

## 📝 Catatan Keamanan

1. **Ganti Password**: Setelah login pertama, segera ganti password
2. **Jangan Share**: Jangan share kredensial admin ke siapapun
3. **Backup**: Simpan kredensial di tempat aman
4. **Production**: Di production, gunakan password yang lebih kuat

## 🎯 Quick Test

Test login admin dengan curl:
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@lautankita.com\",\"password\":\"Admin123456\"}"
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 8,
    "nama": "Administrator",
    "email": "admin@lautankita.com",
    "role": "admin"
  }
}
```

## ✅ Status Saat Ini

- [x] Database terhubung
- [x] Akun admin dibuat (ID: 8)
- [x] Password diverifikasi
- [x] Role = admin
- [x] Verified = true
- [x] Siap login!

## 🚀 Sekarang Anda Bisa:

1. Login di `login.html`
2. Akses admin panel di `admin.html`
3. Kelola semua user, produk, dan pesanan
4. Monitor sistem secara keseluruhan

**Selamat! Admin panel siap digunakan! 🎉**

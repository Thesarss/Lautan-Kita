# 🌊 Lautan Kita

> **E-commerce Hasil Laut** - Platform yang menghubungkan Nelayan/Penjual langsung ke Pembeli

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **🚀 New here?** Start with **[START-HERE.md](START-HERE.md)** for a quick 5-minute setup guide!  
> **📚 Complete Documentation:** See **[MASTER-DOCUMENTATION.md](MASTER-DOCUMENTATION.md)** for all-in-one docs!

---

## 🚀 Quick Start

```bash
# 1. Import database
mysql -u root toko_online < toko_online.sql

# 2. Setup & start backend
cd backend
npm install
cp .env.example .env
npm start

# 3. Buat admin
node create-admin.js

# 4. Buka browser
# http://localhost:3000/home_final.html
```

**Login Admin:**
```
Email    : admin@lautankita.com
Password : Admin123456
```

---

## ✨ Fitur Utama

### 🛒 Untuk Pembeli
- Katalog produk hasil laut
- Keranjang belanja
- Checkout & pembayaran
- Tracking pesanan real-time
- Upload bukti transfer

### 🐟 Untuk Penjual/Nelayan
- Kelola produk (CRUD)
- Upload foto produk
- Statistik penjualan
- Lihat pesanan masuk
- Filter & search produk

### 🚚 Untuk Kurir
- Lihat daftar pengiriman
- Update status pengiriman
- Input nomor resi
- **Privasi:** Hanya lihat alamat tujuan

### 👑 Untuk Admin
- Kelola semua user
- Laporan transaksi (export CSV)
- Moderasi ulasan
- Full access ke semua data

---

## 🛠 Teknologi

**Backend:**
- Node.js + Express
- MySQL (XAMPP)
- JWT Authentication
- bcrypt Password Hashing

**Frontend:**
- HTML5/CSS3/JavaScript
- Responsive Design
- Modal System
- API Helper

---

## 📚 Dokumentasi

### 📖 Dokumentasi Lengkap

**🌟 MASTER DOCUMENTATION (All-in-One):**  
**[MASTER-DOCUMENTATION.md](MASTER-DOCUMENTATION.md)** - Semua dokumentasi dalam satu file!

Berisi:
- Quick Start (5 menit)
- Setup & instalasi detail
- Role & permission matrix
- Dashboard system lengkap
- Admin panel features
- Tracking & lokasi real-time
- API endpoints lengkap
- Testing guide
- Troubleshooting
- Project structure
- Update history

### 📁 Dokumentasi Lainnya

| File | Deskripsi |
|------|-----------|
| [`docs/QUICK-START.md`](docs/QUICK-START.md) | Panduan cepat memulai |
| [`docs/DASHBOARD-SYSTEM-README.md`](docs/DASHBOARD-SYSTEM-README.md) | Sistem dashboard per role |
| [`docs/ADMIN-PANEL-FEATURES.md`](docs/ADMIN-PANEL-FEATURES.md) | Fitur admin panel |
| [`docs/CARA-MEMBUAT-ADMIN.md`](docs/CARA-MEMBUAT-ADMIN.md) | Cara membuat akun admin |
| [`docs/TROUBLESHOOT-LOGIN-ADMIN.md`](docs/TROUBLESHOOT-LOGIN-ADMIN.md) | Troubleshoot login admin |

---

## 👥 Role & Permission

| Role | Dashboard | Kelola Produk | Lihat Pesanan | Lihat Alamat | Admin Access |
|------|-----------|---------------|---------------|--------------|--------------|
| **Pembeli** | ✅ | ❌ | ✅ (sendiri) | ✅ (sendiri) | ❌ |
| **Penjual** | ✅ | ✅ (miliknya) | ✅ (produknya) | ❌ | ❌ |
| **Kurir** | ✅ | ❌ | ✅ (pengiriman) | ✅ (tujuan) | ❌ |
| **Admin** | ✅ | ✅ (semua) | ✅ (semua) | ✅ (semua) | ✅ |

---

## 📦 Instalasi

### Prerequisites
- Node.js v14+
- MySQL 8.0+ (XAMPP)
- Browser modern

### Setup Database

```bash
# Start XAMPP MySQL
# Import database
mysql -u root toko_online < toko_online.sql
```

### Setup Backend

```bash
cd backend
npm install

# Copy dan edit .env
cp .env.example .env

# Start server
npm start
```

Expected output:
```
Server listening on 4000
Database connected
Added produk.kategori column
Added produk.satuan column
```

### Setup Frontend

Buka dengan Live Server atau langsung:
```
http://localhost:3000/home_final.html
```

---

## 🔐 Membuat Admin

### Via Script (Recommended)

```bash
node backend/create-admin.js
```

### Via Web

1. Buka: `http://localhost:3000/registrasi-admin.html`
2. Secret Key: `LAUTAN_KITA_ADMIN_2025`
3. Isi form dan submit

### Verifikasi

```bash
node backend/check-admin.js
```

---

## 🎯 Testing

### Test Flow Pembeli
1. Register sebagai pembeli
2. Login
3. Tambah produk ke keranjang
4. Checkout
5. Upload bukti transfer
6. Tracking pesanan

### Test Flow Penjual
1. Register sebagai penjual
2. Login → Dashboard
3. Tambah produk dengan foto
4. Edit stok produk
5. Lihat pesanan masuk

### Test Flow Admin
1. Login sebagai admin
2. Kelola user (edit, verify)
3. Lihat laporan transaksi
4. Export CSV
5. Moderasi ulasan

---

## 🐛 Troubleshooting

### Backend tidak start
```bash
# Cek port 4000
netstat -ano | findstr :4000

# Kill process jika perlu
taskkill /PID <PID> /F
```

### Database error
1. Pastikan XAMPP MySQL running
2. Cek kredensial di `backend/.env`
3. Import `toko_online.sql`

### Login gagal
1. Cek email/password (case-sensitive)
2. Cek token di localStorage (F12)
3. Pastikan backend running

**Lihat troubleshooting lengkap:** [`docs/TROUBLESHOOT-LOGIN-ADMIN.md`](docs/TROUBLESHOOT-LOGIN-ADMIN.md)

---

## 📁 Struktur Folder

```
lautan-kita/
├── backend/              # Node.js backend
│   ├── src/             # Source code
│   ├── uploads/         # Upload files
│   └── .env             # Config
├── assets/              # Frontend assets
├── img/                 # Images
├── views/               # Additional pages
├── docs/                # Documentation
├── archive/             # Old files
├── *.html               # Main pages
└── toko_online.sql      # Database schema
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /auth/register
POST   /auth/login
GET    /auth/me
```

### Products
```
GET    /products
POST   /penjual/produk
PATCH  /penjual/produk/:id
```

### Orders
```
POST   /orders/checkout
GET    /orders
POST   /orders/:id/cancel
```

### Admin
```
GET    /admin/users
PATCH  /admin/users/:id
GET    /admin/transactions
GET    /admin/reviews
```

**Lihat API lengkap:** [`docs/COMPLETE-DOCUMENTATION.md#api-endpoints`](docs/COMPLETE-DOCUMENTATION.md#-api-endpoints)

---

## 📝 Changelog

### Version 1.0.0 (10 Desember 2025)

**Added:**
- ✅ Dashboard role-based
- ✅ Admin panel lengkap
- ✅ Laporan transaksi & export CSV
- ✅ Moderasi ulasan
- ✅ Upload foto produk
- ✅ Kurir privacy mode

**Fixed:**
- ✅ Role kurir registration
- ✅ Admin login issues
- ✅ Password validation

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Team

**Lautan Kita Development Team**

---

## 📞 Support

- 📚 Documentation: [`docs/`](docs/)
- 🐛 Issues: Create an issue
- 💬 Contact: [email@example.com](mailto:email@example.com)

---

**Made with ❤️ by Lautan Kita Team**

Last Updated: 10 Desember 2025

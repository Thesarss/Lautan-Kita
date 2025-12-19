# 🌊 Lautan Kita

> **E-commerce Hasil Laut** - Platform yang menghubungkan Nelayan/Penjual langsung ke Pembeli

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
node src/app.js

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
- Lihat lokasi kurir

### 🐟 Untuk Penjual/Nelayan
- Kelola produk (CRUD)
- Upload foto produk
- Statistik penjualan
- Lihat pesanan masuk
- Auto-assign kurir

### 🚚 Untuk Kurir
- Lihat daftar pengiriman
- Update lokasi terakhir
- Verifikasi pesanan sampai
- Riwayat pengiriman

### 👑 Untuk Admin
- Kelola semua user
- Laporan transaksi (export CSV)
- Moderasi ulasan
- Full access ke semua data

---

## 🛠 Teknologi

**Backend:** Node.js + Express + MySQL + JWT + bcrypt  
**Frontend:** HTML5 + CSS3 + JavaScript  
**Database:** MySQL (XAMPP)

---

## 📚 Dokumentasi

**🌟 Semua dokumentasi dalam satu file:**  
**[MASTER-DOCUMENTATION.md](MASTER-DOCUMENTATION.md)**

Berisi:
- Quick Start (5 menit)
- Setup & instalasi detail
- Role & permission matrix
- Dashboard system lengkap
- Admin panel features
- Tracking & lokasi real-time
- API endpoints lengkap (30+)
- Testing guide (8 scenarios)
- Troubleshooting
- Project structure
- Update history

---

## 👥 Role & Permission

| Role | Beli | Jual | Kirim | Admin |
|------|------|------|-------|-------|
| **Pembeli** | ✅ | ❌ | ❌ | ❌ |
| **Penjual** | ❌ | ✅ | ❌ | ❌ |
| **Kurir** | ❌ | ❌ | ✅ | ❌ |
| **Admin** | ❌ | ❌ | ❌ | ✅ |

---

## 📁 Struktur Folder

```
lautan-kita/
├── backend/              # Node.js backend
│   ├── src/             # Source code
│   │   ├── routes/      # API routes
│   │   └── middleware/  # Auth middleware
│   ├── uploads/         # Upload files
│   └── .env             # Config
├── assets/js/           # Frontend JS
├── img/                 # Images
├── *.html               # Main pages
├── toko_online.sql      # Database schema
├── README.md            # This file
└── MASTER-DOCUMENTATION.md  # Complete docs
```

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/me` - Get user info

### Products
- `GET /products` - List products
- `POST /penjual/produk` - Add product
- `PATCH /penjual/produk/:id` - Update product

### Orders
- `POST /orders/checkout` - Checkout
- `GET /orders/my-orders` - My orders
- `PATCH /orders/:id/pack` - Pack order (penjual)
- `PATCH /orders/:id/ship` - Ship order (kurir)

### Kurir
- `GET /kurir/deliveries` - Get deliveries
- `PATCH /kurir/orders/:id/location` - Update location
- `PATCH /kurir/orders/:id/delivered` - Verify delivered

### Admin
- `GET /admin/users` - List users
- `PATCH /admin/users/:id` - Edit user
- `GET /admin/transactions` - Transactions
- `GET /admin/reviews` - Reviews

**Lihat API lengkap:** [MASTER-DOCUMENTATION.md](MASTER-DOCUMENTATION.md#-api-endpoints)

---

## 📝 Version History

### v1.3.0 (December 15, 2025)
- ✅ Laporan Penjualan untuk Penjual
- ✅ Rating & Ulasan Produk untuk Pembeli
- ✅ Statistik rating toko

### v1.2.0 (December 11, 2025)
- ✅ Tracking lokasi real-time
- ✅ Kurir update lokasi & verifikasi sampai
- ✅ Auto-assign kurir (round-robin)
- ✅ Admin restrictions

### v1.0.0 (December 10, 2025)
- ✅ Initial release
- ✅ Dashboard role-based
- ✅ Admin panel lengkap
- ✅ Checkout & payment

---

## 📞 Support

- **Documentation:** [MASTER-DOCUMENTATION.md](MASTER-DOCUMENTATION.md)
- **Email:** lautankita@gmail.com
- **Phone:** +62 811 1234 5678

---

**Made with ❤️ by Lautan Kita Team**

**Last Updated:** December 15, 2025 | **Version:** 1.3.0

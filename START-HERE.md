# 🚀 START HERE - Lautan Kita

**Welcome to Lautan Kita!** This is your quick start guide.

---

## 📖 What is Lautan Kita?

Platform digital yang menghubungkan nelayan lokal dengan konsumen, menyediakan produk laut segar, transparan, dan berkelanjutan.

**Tech Stack:**
- Backend: Node.js + Express + MySQL
- Frontend: HTML + CSS + JavaScript
- Auth: JWT + bcrypt
- Database: MySQL (XAMPP)

---

## ⚡ Quick Start (5 Minutes)

### 1. Prerequisites
```bash
✅ Node.js v14+ installed
✅ XAMPP with MySQL running
✅ Git (optional)
```

### 2. Setup Database
1. Start XAMPP MySQL
2. Open phpMyAdmin: `http://localhost/phpmyadmin`
3. Import database: `toko_online.sql`

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env if needed (default should work)
node src/app.js
```

**Expected output:**
```
Server listening on 4000
Database connected
```

### 4. Create Admin Account
```bash
# In backend folder
node create-admin.js
```

**Credentials:**
- Email: `admin@lautankita.com`
- Password: `Admin123456`

### 5. Open Frontend
- Open `home_final.html` in browser
- Or use Live Server on port 3000

### 6. Login & Test
1. Go to `login.html`
2. Login with admin credentials
3. Navigate to `admin.html`
4. Test features!

---

## 📚 Documentation

### Essential Reading (in order):

1. **README.md** (5 min)
   - Project overview
   - Features
   - Quick links

2. **docs/QUICK-START.md** (10 min)
   - Detailed setup
   - Configuration
   - First steps

3. **docs/COMPLETE-DOCUMENTATION.md** (30 min)
   - Full documentation
   - All features
   - API reference

### Specific Topics:

| Topic | Document | Time |
|-------|----------|------|
| Admin Setup | `docs/CARA-MEMBUAT-ADMIN.md` | 5 min |
| Admin Features | `docs/ADMIN-PANEL-FEATURES.md` | 10 min |
| Dashboard System | `docs/DASHBOARD-SYSTEM-README.md` | 15 min |
| Testing | `docs/TESTING-GUIDE.md` | 20 min |
| Troubleshooting | `docs/TROUBLESHOOT-LOGIN-ADMIN.md` | 5 min |

---

## 🎯 What Can You Do?

### As Admin:
- ✅ Manage users (edit, verify, change roles)
- ✅ View transaction reports
- ✅ Moderate reviews (show/hide)
- ✅ Manage products (approve/reject)
- ✅ Export data to CSV

### As Penjual (Seller):
- ✅ Add/edit products
- ✅ Upload product photos
- ✅ Manage inventory
- ✅ View sales stats
- ✅ Filter & search products

### As Pembeli (Buyer):
- ✅ Browse products
- ✅ Add to cart
- ✅ Checkout & pay
- ✅ Track orders
- ✅ Write reviews

### As Kurir (Courier):
- ✅ View assigned deliveries
- ✅ Update delivery status
- ✅ Track routes
- ✅ Complete deliveries

---

## 🗂️ Project Structure

```
lautan-kita/
├── 📖 START-HERE.md          ← You are here!
├── 📖 README.md              ← Project overview
├── 📖 CLEANUP-SUMMARY.md     ← Cleanup details
│
├── 📚 docs/                  ← All documentation
│   ├── COMPLETE-DOCUMENTATION.md
│   ├── QUICK-START.md
│   ├── TESTING-GUIDE.md
│   ├── POST-CLEANUP-VERIFICATION.md
│   └── ... (10+ more docs)
│
├── 🗄️ archive/              ← Old files (reference only)
│   ├── design-mockups/
│   └── reference-files/
│
├── 🔧 backend/              ← Node.js backend
│   ├── src/
│   │   ├── app.js
│   │   ├── routes/
│   │   └── middleware/
│   ├── uploads/
│   ├── package.json
│   └── .env
│
├── 🎨 assets/               ← Frontend assets
│   └── js/
│       └── api.js
│
├── 🖼️ img/                 ← Images
│
├── 📄 views/                ← Additional pages
│
├── 🌐 *.html                ← Main pages
│   ├── home_final.html
│   ├── login.html
│   ├── admin.html
│   ├── dashboard-*.html
│   └── ...
│
├── 🎨 *.css                 ← Stylesheets
└── 🗄️ toko_online.sql      ← Database schema
```

---

## 🔑 Default Credentials

### Admin Account
- Email: `admin@lautankita.com`
- Password: `Admin123456`
- Role: `admin`

### Test Accounts (Create via registrasi.html)
- Penjual: Register with role "penjual"
- Pembeli: Register with role "pembeli"
- Kurir: Register with role "kurir"

---

## 🧪 Quick Test

### Test 1: Login
```
1. Open login.html
2. Email: admin@lautankita.com
3. Password: Admin123456
4. Click "Masuk"
✅ Should redirect to home_final.html
```

### Test 2: Admin Panel
```
1. Navigate to admin.html
2. Click "Kelola Pengguna"
3. View user list
✅ Should see all users
```

### Test 3: Add Product
```
1. Login as penjual
2. Go to dashboard-penjual.html
3. Click "Tambah Produk"
4. Fill form and save
✅ Product should appear in list
```

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check MySQL is running
# Check database exists
# Check .env file
# Check port 4000 is free
```

### Can't login?
```bash
# Verify admin exists
node backend/check-admin.js

# Create admin if needed
node backend/create-admin.js
```

### Images not loading?
```bash
# Check backend/uploads/ folder exists
# Check backend is running
# Check image paths in database
```

### More help?
See: `docs/TROUBLESHOOT-LOGIN-ADMIN.md`

---

## 📊 Project Status

### ✅ Completed Features
- Authentication (login, register, JWT)
- Role-based access control (pembeli, penjual, kurir, admin)
- Admin panel (user management, reports, moderation)
- Dashboard penjual (product management)
- Dashboard kurir (delivery management)
- Product detail pages
- Shopping cart
- Checkout & payment
- Order tracking (full lifecycle)
- Review system (with moderation)
- File uploads (products, avatars)
- Auto-assign kurir (round-robin algorithm)
- Multi-layer role restrictions (backend + frontend)

### 🚧 In Progress
- Email notifications
- Password reset functionality
- Advanced analytics
- Mobile responsive improvements

### 📋 Planned
- Payment gateway integration
- Real-time notifications
- Chat system
- Mobile app

---

## 🎓 Learning Path

### Beginner (Day 1)
1. Read README.md
2. Setup project
3. Create admin account
4. Test login
5. Explore admin panel

### Intermediate (Day 2-3)
1. Read COMPLETE-DOCUMENTATION.md
2. Test all features
3. Create test accounts
4. Add sample products
5. Test full workflow

### Advanced (Day 4+)
1. Study backend code
2. Understand API endpoints
3. Customize features
4. Add new functionality
5. Deploy to production

---

## 🔗 Quick Links

### Documentation
- [README.md](README.md) - Project overview
- [docs/COMPLETE-DOCUMENTATION.md](docs/COMPLETE-DOCUMENTATION.md) - Full docs
- [docs/QUICK-START.md](docs/QUICK-START.md) - Setup guide
- [docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md) - Testing guide

### Backend Scripts
- `backend/create-admin.js` - Create admin account
- `backend/check-admin.js` - Verify admin exists
- `backend/create-admin-force.js` - Force create admin

### Main Pages
- `home_final.html` - Homepage
- `login.html` - Login page
- `admin.html` - Admin panel
- `dashboard-penjual.html` - Seller dashboard
- `dashboard-pembeli.html` - Buyer dashboard
- `dashboard-kurir.html` - Courier dashboard

---

## 💡 Tips

### Development
- Use Live Server for auto-reload
- Keep backend running in separate terminal
- Check browser console for errors
- Use Chrome DevTools for debugging

### Testing
- Test with different roles
- Clear localStorage between tests
- Check Network tab for API calls
- Verify database changes in phpMyAdmin

### Deployment
- Update .env for production
- Use environment variables
- Enable HTTPS
- Setup proper CORS
- Use process manager (PM2)

---

## 🆘 Need Help?

### Documentation
1. Check `docs/COMPLETE-DOCUMENTATION.md`
2. Check `docs/TROUBLESHOOT-LOGIN-ADMIN.md`
3. Check `docs/TESTING-GUIDE.md`

### Common Issues
- Backend issues → Check MySQL, .env, port
- Login issues → Check admin account exists
- Image issues → Check uploads folder, backend running
- API issues → Check Network tab, backend logs

### Contact
- Email: lautankita@gmail.com
- Phone: +62 811 1234 5678

---

## ✅ Checklist

Before you start coding:
- [ ] Read this file (START-HERE.md)
- [ ] Read README.md
- [ ] Setup database
- [ ] Start backend
- [ ] Create admin account
- [ ] Test login
- [ ] Explore admin panel
- [ ] Read COMPLETE-DOCUMENTATION.md

---

## 🎉 You're Ready!

Everything is set up and verified. Start exploring!

**Next Steps:**
1. Login as admin
2. Create test accounts
3. Add sample products
4. Test all features
5. Start customizing!

**Happy Coding! 🚀**

---

**Last Updated**: December 11, 2025  
**Version**: 1.1.0  
**Status**: ✅ Production Ready

**Latest Updates (v1.1.0)**:
- ✅ Auto-assign kurir dengan round-robin algorithm
- ✅ Admin restrictions (tidak bisa beli produk)
- ✅ Multi-layer security (backend + page + action level)
- ✅ Complete admin panel features

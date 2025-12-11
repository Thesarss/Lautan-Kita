# 🧪 Testing Guide - Lautan Kita

**Last Updated**: December 10, 2025

## 📋 Pre-Testing Checklist

- [ ] XAMPP MySQL is running
- [ ] Database `toko_online` exists
- [ ] Backend `.env` file configured
- [ ] Node.js installed (v14+)
- [ ] npm packages installed

---

## 🚀 Quick Start Testing

### 1. Start Backend

```bash
cd backend
npm install
node src/app.js
```

**Expected Output:**
```
Server listening on 4000
Database connected
Added user.avatar_url column (if first run)
Added produk.photo_url column (if first run)
Added produk.kategori column (if first run)
Added produk.satuan column (if first run)
Updated user.role enum to include kurir (if first run)
```

### 2. Create Admin Account (First Time Only)

```bash
# In backend folder
node create-admin.js
```

**Expected Output:**
```
Admin created successfully!
Email: admin@lautankita.com
Password: Admin123456
User ID: [number]
```

### 3. Open Frontend

Open in browser:
- `http://localhost:3000/home_final.html` (if using Live Server)
- Or open `home_final.html` directly in browser

---

## 🧪 Test Cases

### Test 1: Authentication

#### 1.1 Login as Admin
1. Open `login.html`
2. Enter credentials:
   - Email: `admin@lautankita.com`
   - Password: `Admin123456`
3. Click "Masuk"

**Expected Result:**
- ✅ Success modal appears
- ✅ Redirected to `home_final.html`
- ✅ Token saved in localStorage

#### 1.2 Register New User
1. Open `registrasi.html`
2. Fill form:
   - Nama: Test User
   - Email: test@example.com
   - Password: Test123456
   - No Telp: 081234567890
   - Alamat: Test Address
   - Role: pembeli
3. Click "Daftar"

**Expected Result:**
- ✅ Success modal appears
- ✅ User created in database
- ✅ Can login with new credentials

#### 1.3 Forgot Password
1. Open `login.html`
2. Click "Lupa password?"
3. Verify placeholder page loads

**Expected Result:**
- ✅ `forgot-password.html` loads
- ✅ Info message displayed
- ✅ Back to login link works

---

### Test 2: Admin Panel

#### 2.1 Access Admin Panel
1. Login as admin
2. Navigate to `admin.html`

**Expected Result:**
- ✅ Admin panel loads
- ✅ Sidebar menu visible
- ✅ Dashboard stats displayed

#### 2.2 User Management
1. Click "Kelola Pengguna" in sidebar
2. Verify user list loads
3. Click "Edit" on a user
4. Change nama/email/role
5. Click "Simpan"

**Expected Result:**
- ✅ User list displays all users
- ✅ Edit modal opens
- ✅ Changes saved successfully
- ✅ User list refreshes

#### 2.3 Transaction Reports
1. Click "Laporan Transaksi" in sidebar
2. Select date range
3. Filter by status
4. Click "Export CSV"

**Expected Result:**
- ✅ Transaction list displays
- ✅ Filters work correctly
- ✅ CSV downloads successfully
- ✅ Statistics show correct totals

#### 2.4 Review Moderation
1. Click "Moderasi Ulasan" in sidebar
2. View review list
3. Click "Sembunyikan" on a review
4. Verify status changes

**Expected Result:**
- ✅ Review list displays
- ✅ Status toggle works
- ✅ Hidden reviews marked correctly
- ✅ Changes persist after refresh

---

### Test 3: Dashboard Penjual

#### 3.1 Access Dashboard
1. Login as penjual
2. Navigate to `dashboard-penjual.html`

**Expected Result:**
- ✅ Dashboard loads
- ✅ Product list displays
- ✅ Stats cards show data

#### 3.2 Add Product
1. Click "Tambah Produk"
2. Fill form:
   - Nama: Ikan Test
   - Kategori: ikan
   - Harga: 50000
   - Satuan: kg
   - Stok: 10
   - Deskripsi: Test product
   - Status: aktif
3. Upload photo
4. Click "Simpan"

**Expected Result:**
- ✅ Form validation works
- ✅ Photo preview displays
- ✅ Product saved successfully
- ✅ Product appears in list

#### 3.3 Edit Product
1. Click "Edit" on a product
2. Change details
3. Click "Simpan"

**Expected Result:**
- ✅ Edit modal opens with current data
- ✅ Changes saved successfully
- ✅ Product list updates

#### 3.4 Toggle View
1. Click "Grid" button
2. Click "Tabel" button

**Expected Result:**
- ✅ View switches between grid and table
- ✅ All products visible in both views
- ✅ Actions work in both views

#### 3.5 Filter Products
1. Enter search term
2. Select status filter
3. Verify results

**Expected Result:**
- ✅ Search filters by name
- ✅ Status filter works
- ✅ Combined filters work
- ✅ Clear filters resets view

---

### Test 4: Product Detail Page

#### 4.1 View Product
1. Open `home_final.html`
2. Click on a product
3. Verify detail page loads

**Expected Result:**
- ✅ Product details display correctly
- ✅ Image loads
- ✅ Price and stock shown
- ✅ Description visible

#### 4.2 Add to Cart
1. On product detail page
2. Click "Keranjang" button

**Expected Result:**
- ✅ Success modal appears
- ✅ Product added to cart
- ✅ Can view cart

#### 4.3 Buy Now
1. On product detail page
2. Click "Beli Sekarang" button

**Expected Result:**
- ✅ Product added to cart
- ✅ Redirected to checkout
- ✅ Product in checkout list

---

### Test 5: File Upload

#### 5.1 Product Photo Upload
1. Login as penjual
2. Add/edit product
3. Select image file
4. Verify preview

**Expected Result:**
- ✅ File input accepts images
- ✅ Preview displays immediately
- ✅ Image saved to `backend/uploads/products/`
- ✅ Image accessible via `/uploads/products/[filename]`

#### 5.2 Avatar Upload
1. Login as any user
2. Go to profile page
3. Upload avatar
4. Save

**Expected Result:**
- ✅ Avatar preview displays
- ✅ Image saved to `backend/uploads/avatars/`
- ✅ Avatar displays in profile
- ✅ Avatar persists after logout/login

---

### Test 6: API Endpoints

#### 6.1 Test with curl/Postman

**Login:**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lautankita.com","password":"Admin123456"}'
```

**Get Products:**
```bash
curl http://localhost:4000/products
```

**Get Users (Admin):**
```bash
curl http://localhost:4000/admin/users \
  -H "Authorization: Bearer [TOKEN]"
```

**Expected Results:**
- ✅ Login returns token
- ✅ Products list returns array
- ✅ Admin endpoints require auth
- ✅ Proper error messages for invalid requests

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend won't start
**Symptoms:**
- "Database connection failed"
- "ECONNREFUSED"

**Solutions:**
1. Check XAMPP MySQL is running
2. Verify database `toko_online` exists
3. Check `.env` credentials match MySQL
4. Ensure port 4000 is not in use

### Issue 2: Login fails
**Symptoms:**
- "Login gagal" message
- No token saved

**Solutions:**
1. Verify admin account exists: `node backend/check-admin.js`
2. Create admin if needed: `node backend/create-admin.js`
3. Check password is correct: `Admin123456`
4. Clear browser localStorage and try again

### Issue 3: Images not loading
**Symptoms:**
- Broken image icons
- 404 errors for `/uploads/`

**Solutions:**
1. Check `backend/uploads/` folder exists
2. Verify backend is serving static files
3. Check image paths in database
4. Ensure images uploaded successfully

### Issue 4: Admin panel not accessible
**Symptoms:**
- Redirected to login
- "Unauthorized" error

**Solutions:**
1. Verify logged in as admin role
2. Check token in localStorage
3. Verify token not expired
4. Check user role in database: `SELECT role FROM user WHERE email='admin@lautankita.com'`

### Issue 5: CSS not loading
**Symptoms:**
- Unstyled pages
- Missing styles

**Solutions:**
1. Check `Desktop2style.css` exists in root
2. Check `pembayaran.css` exists in root
3. Verify file paths in HTML
4. Clear browser cache

---

## 📊 Test Results Template

Use this template to document your test results:

```markdown
## Test Session: [Date]

### Environment
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Node.js: [version]
- MySQL: [version]

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Login as Admin | ✅ Pass | |
| Register User | ✅ Pass | |
| Add Product | ✅ Pass | |
| Edit User | ✅ Pass | |
| Upload Image | ✅ Pass | |
| View Reports | ✅ Pass | |

### Issues Found
1. [Issue description]
   - Severity: [Low/Medium/High]
   - Steps to reproduce: [...]
   - Expected: [...]
   - Actual: [...]

### Notes
[Any additional observations]
```

---

## ✅ Testing Checklist

### Authentication
- [ ] Login as admin
- [ ] Login as penjual
- [ ] Login as pembeli
- [ ] Login as kurir
- [ ] Register new user
- [ ] Logout
- [ ] Forgot password page

### Admin Panel
- [ ] Access admin panel
- [ ] View user list
- [ ] Edit user
- [ ] Change user role
- [ ] Toggle user verification
- [ ] View transactions
- [ ] Filter transactions
- [ ] Export CSV
- [ ] View reviews
- [ ] Hide/show reviews
- [ ] View products
- [ ] Change product status

### Dashboard Penjual
- [ ] View dashboard
- [ ] Add product
- [ ] Edit product
- [ ] Delete product
- [ ] Upload product photo
- [ ] Toggle grid/table view
- [ ] Search products
- [ ] Filter by status
- [ ] View stats

### Product Pages
- [ ] View product list
- [ ] View product detail
- [ ] Add to cart
- [ ] Buy now
- [ ] View reviews

### File Uploads
- [ ] Upload product photo
- [ ] Upload avatar
- [ ] View uploaded images

### API Endpoints
- [ ] POST /auth/login
- [ ] POST /auth/register
- [ ] GET /auth/me
- [ ] GET /products
- [ ] POST /products
- [ ] PATCH /products/:id
- [ ] GET /admin/users
- [ ] PATCH /admin/users/:id
- [ ] GET /admin/transactions
- [ ] GET /admin/reviews

---

## 🎯 Performance Testing

### Load Testing
1. Test with 10 concurrent users
2. Test with 100 products
3. Test with 1000 transactions
4. Monitor response times

### Stress Testing
1. Upload large images (5MB+)
2. Create many products quickly
3. Filter large datasets
4. Export large CSV files

### Expected Performance
- Page load: < 2 seconds
- API response: < 500ms
- Image upload: < 3 seconds
- CSV export: < 5 seconds

---

## 📝 Test Report

After completing tests, document:

1. **Test Coverage**: % of features tested
2. **Pass Rate**: % of tests passed
3. **Critical Issues**: High priority bugs
4. **Recommendations**: Improvements needed
5. **Next Steps**: Follow-up actions

---

## 🚀 Automated Testing (Future)

Consider adding:
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Cypress/Playwright)
- API tests (Postman/Newman)

---

**Happy Testing! 🧪**

For issues or questions, refer to:
- `docs/COMPLETE-DOCUMENTATION.md`
- `docs/POST-CLEANUP-VERIFICATION.md`
- `docs/TROUBLESHOOT-LOGIN-ADMIN.md`

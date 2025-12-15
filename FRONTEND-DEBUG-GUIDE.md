# 🔧 Frontend Debug Guide - Dashboard Pembeli

## ✅ **BACKEND STATUS**
- ✅ Backend server running on port 4000
- ✅ Database connected
- ✅ Test user exists: `pembeli@test.com`
- ✅ 18 orders available for test user
- ✅ API endpoints working correctly

## 🐛 **FRONTEND DEBUGGING STEPS**

### **Step 1: Test Files Created**
I've created several test files to help debug:

1. **`test-login-and-dashboard.html`** - Comprehensive testing tool
2. **`simple-dashboard-test.html`** - Minimal test with auto-login
3. **`debug-frontend.html`** - Basic connectivity test

### **Step 2: Open Test Files**

**Option A: Use Simple Test (Recommended)**
1. Open `simple-dashboard-test.html` in your browser
2. It will automatically login and show debug info
3. Check what step fails

**Option B: Use Comprehensive Test**
1. Open `test-login-and-dashboard.html` in your browser
2. Click "Run Complete Test" button
3. See detailed results

### **Step 3: Manual Testing**

**Test Login:**
1. Open `login.html`
2. Login with:
   - Email: `pembeli@test.com`
   - Password: `password123`
3. Should redirect to `home_final.html`

**Test Dashboard:**
1. After login, open `dashboard-pembeli.html`
2. Open browser Developer Tools (F12)
3. Check Console tab for errors
4. Check Network tab for API calls

## 🔍 **COMMON ISSUES & SOLUTIONS**

### **Issue 1: JavaScript Errors**
**Symptoms:** Console shows errors
**Solution:** 
- Check if `assets/js/api.js` is loading
- Check for syntax errors in dashboard-pembeli.html

### **Issue 2: Authentication Issues**
**Symptoms:** "No auth token" or "Authentication failed"
**Solution:**
- Clear browser cache and localStorage
- Login again with test credentials
- Check if token is saved: `localStorage.getItem('auth_token')`

### **Issue 3: API Connection Issues**
**Symptoms:** Network errors, CORS errors
**Solution:**
- Ensure backend server is running
- Check API base URL is `http://localhost:4000`
- Try accessing `http://localhost:4000/health` directly

### **Issue 4: Empty Dashboard**
**Symptoms:** Dashboard shows "Memuat pesanan..." forever
**Solution:**
- Check browser console for JavaScript errors
- Verify API calls in Network tab
- Use test files to isolate the issue

## 🧪 **DEBUGGING COMMANDS**

**In Browser Console:**
```javascript
// Check if API object exists
console.log(window.API);

// Check auth token
console.log(localStorage.getItem('auth_token'));

// Test API call manually
window.API.authFetch('/orders/my-orders').then(r => r.json()).then(console.log);

// Clear auth and retry
localStorage.removeItem('auth_token');
window.location.reload();
```

## 📋 **EXPECTED RESULTS**

**After Login:**
- localStorage should contain `auth_token`
- Console should show no JavaScript errors

**Dashboard Should Show:**
- Welcome message with user name
- Statistics: Menunggu: 7, Diproses: 0, Dikirim: 5, Selesai: 6
- List of 18 orders

## 🚨 **IF STILL NOT WORKING**

1. **Try the simple test file first:** `simple-dashboard-test.html`
2. **Check browser console** for any red error messages
3. **Check Network tab** to see if API calls are being made
4. **Try different browser** (Chrome, Firefox, Edge)
5. **Clear all browser data** for localhost

## 📞 **NEXT STEPS**

Please try the test files and let me know:
1. What does `simple-dashboard-test.html` show?
2. Any error messages in browser console?
3. What happens in Network tab when loading dashboard?
4. Does login work correctly?

The backend is confirmed working, so the issue is definitely in the frontend/browser side.

---

**Files to test:**
- ✅ `simple-dashboard-test.html` (auto-login + debug)
- ✅ `test-login-and-dashboard.html` (comprehensive test)
- ✅ `debug-frontend.html` (basic connectivity)

**Backend confirmed working:**
- ✅ Server running
- ✅ 18 orders available
- ✅ Login API working
- ✅ Orders API working
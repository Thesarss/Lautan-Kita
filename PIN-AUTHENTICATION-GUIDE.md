# 🔐 PIN Authentication Guide - Lautan Kita

## Sistem PIN Pembayaran

Aplikasi Lautan Kita menggunakan **dummy PIN authentication** untuk keperluan demo dan testing.

## 📋 Cara Menggunakan PIN

### ✅ PIN yang Valid
- **Format**: 6 digit angka
- **Contoh PIN yang bisa digunakan**:
  - `123456`
  - `000000`
  - `111111`
  - `999999`
  - `654321`
  - `112233`

### ❌ PIN yang Tidak Valid
- Kurang dari 6 digit: `12345`
- Lebih dari 6 digit: `1234567`
- Mengandung huruf: `12345a`
- Mengandung karakter khusus: `12345!`

## 🔄 Flow Pembayaran

1. **Checkout/Konfirmasi Pembayaran** → Klik tombol konfirmasi
2. **Redirect ke Halaman Autentikasi** → Masukkan PIN 6 digit
3. **Validasi PIN** → Sistem menerima PIN apapun (6 digit angka)
4. **Pembayaran Berhasil** → Status pesanan berubah ke "Pembayaran Dikonfirmasi"

## 🎯 Tujuan Sistem Dummy

Sistem ini dibuat untuk:
- **Demo aplikasi** tanpa integrasi payment gateway nyata
- **Testing flow pembayaran** end-to-end
- **Simulasi keamanan** dengan autentikasi PIN
- **Pengembangan UI/UX** yang realistis

## 🔧 Implementasi Teknis

```javascript
// Validasi PIN (dummy)
if (!/^\d{6}$/.test(pin)) {
    alert('PIN harus berupa 6 digit angka');
    return;
}
// Semua PIN 6 digit akan diterima
```

## 📱 Penggunaan di Aplikasi

### Dari Dashboard Pembeli:
1. Lihat pesanan dengan status "Menunggu Pembayaran"
2. Klik "Konfirmasi Bayar"
3. Masukkan PIN 6 digit (contoh: `123456`)
4. Pembayaran berhasil dikonfirmasi

### Dari Checkout:
1. Selesaikan checkout produk
2. Klik "Konfirmasi Pembayaran"
3. Masukkan PIN 6 digit (contoh: `123456`)
4. Redirect ke halaman pembayaran berhasil

## 🚀 Quick Start

**Ingin coba sekarang?**
1. Login sebagai pembeli
2. Tambah produk ke keranjang
3. Checkout
4. Gunakan PIN: `123456`
5. Selesai! ✅

---

*Catatan: Dalam implementasi production, PIN akan divalidasi dengan sistem keamanan yang sesungguhnya dan terintegrasi dengan payment gateway.*
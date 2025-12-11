# Halaman Detail Produk - Lautan Kita

## File yang Dibuat/Dimodifikasi

### 1. **detail-produk.html** (BARU)
Halaman detail produk yang dinamis, dapat menampilkan informasi lengkap untuk semua produk.

### 2. **home_final.html** (DIMODIFIKASI)
Fungsi `viewDetail()` diupdate untuk redirect ke `detail-produk.html`

## Fitur Halaman Detail Produk

### ✅ Fitur Utama
- **Dinamis**: Satu halaman untuk semua produk
- **Integrasi Backend**: Mengambil data dari API `/products`
- **Fallback Lokal**: Jika backend tidak tersedia, gunakan data lokal
- **Responsive**: Desain mobile-friendly
- **Gambar Default**: Auto-detect gambar berdasarkan nama produk

### 📋 Informasi yang Ditampilkan
1. **Gambar Produk** - Dari backend atau fallback ke gambar lokal
2. **Nama Produk** - Dinamis dari database
3. **Harga** - Format Rupiah per kg
4. **Stok** - Jumlah tersedia
5. **Rating** - Bintang 1-5
6. **Deskripsi** - Detail produk lengkap
7. **Kategori** - Jenis hasil laut
8. **Status** - Tersedia/Tidak Tersedia
9. **Info Penjual** - Nama dan avatar penjual
10. **Review Pembeli** - Ulasan dan foto (jika ada)

### 🔘 Tombol Aksi
- **🛒 Keranjang** - Tambah ke keranjang (perlu login)
- **Beli Sekarang** - Langsung checkout (perlu login)
- **Kunjungi** - Lihat toko penjual (coming soon)

## Cara Menggunakan

### Dari Beranda (home_final.html)
```javascript
// Klik tombol "Lihat Detail" pada kartu produk
// Otomatis redirect ke: detail-produk.html?id=ikan-belanak
```

### URL Format
```
detail-produk.html?id=<product-id>
```

**Contoh:**
- `detail-produk.html?id=ikan-belanak`
- `detail-produk.html?id=udang`
- `detail-produk.html?id=kepiting`
- `detail-produk.html?id=123` (ID numerik dari backend)

## Integrasi dengan Backend

### API Endpoint yang Digunakan
```javascript
GET /products
// Mengambil semua produk dari backend
```

### Response Format
```json
[
  {
    "produk_id": 1,
    "nama_produk": "Ikan Belanak",
    "harga": 40000,
    "stok": 15,
    "deskripsi": "Ikan segar...",
    "photo_url": "/uploads/products/1.jpg",
    "penjual_nama": "Budi Fisherman",
    "kategori_id": 1,
    "status": "aktif"
  }
]
```

### Pencarian Produk
Sistem mencari produk dengan 2 cara:
1. **ID Numerik**: `produk_id == productId`
2. **Slug Name**: `nama_produk.toLowerCase().replace(/\s+/g, '-') === productId`

Contoh:
- "Ikan Belanak" → slug: "ikan-belanak"
- "Ikan Tongkol" → slug: "ikan-tongkol"

## Fallback Data Lokal

Jika backend tidak tersedia, sistem menggunakan data lokal untuk produk:
- ikan-belanak
- ikan-puri
- udang
- kepiting
- ikan-tongkol
- sotong
- ikan-kakap

## Gambar Default

Fungsi `getDefaultImage()` otomatis mendeteksi gambar berdasarkan nama:
```javascript
'belanak' → 'img/ikan-belanak.png'
'puri' → 'img/ikan-puri.png'
'udang' → 'img/udang.png'
'kepiting' → 'img/kepiting.png'
'tongkol' → 'img/ikan-tongkol.png'
'sotong' → 'img/sotong.png'
'kakap' → 'img/ikan-kakap.png'
default → 'img/logo.png'
```

## Styling

Menggunakan **Desktop2style.css** yang sudah ada dengan:
- Warna primary: `#0077b6`
- Warna secondary: `#e0f3ff`
- Warna accent: `#ffce00`
- Warna gold (rating): `#f1c40f`

## Testing

### Test Manual
1. Buka `home_final.html`
2. Klik "Lihat Detail" pada produk apapun
3. Verifikasi:
   - ✅ Gambar produk muncul
   - ✅ Harga dan stok benar
   - ✅ Deskripsi lengkap
   - ✅ Tombol keranjang & beli berfungsi
   - ✅ Info penjual tampil

### Test dengan Backend
1. Pastikan backend running di `http://localhost:4000`
2. Pastikan ada produk di database
3. Buka detail produk dengan ID numerik: `detail-produk.html?id=1`

### Test Tanpa Backend
1. Matikan backend
2. Buka detail produk dengan slug: `detail-produk.html?id=ikan-belanak`
3. Sistem akan gunakan data lokal

## Error Handling

### Produk Tidak Ditemukan
```javascript
API.showModal({ 
    title: 'Error', 
    message: 'Produk tidak ditemukan!',
    actions: [{ 
        label: 'Kembali', 
        variant: 'primary', 
        handler: () => { window.location.href = 'home_final.html'; } 
    }]
});
```

### Belum Login
```javascript
API.showModal({ 
    title: 'Login Diperlukan', 
    message: 'Silakan login terlebih dahulu...',
    actions: [
        { label: 'Login', variant: 'primary', handler: () => { window.location.href = 'login.html'; } },
        { label: 'Batal', variant: 'secondary', handler: API.hideModal }
    ]
});
```

## Fitur Mendatang
- [ ] Multiple review dari pembeli
- [ ] Rating dinamis dari database
- [ ] Galeri foto produk (multiple images)
- [ ] Rekomendasi produk serupa
- [ ] Share ke social media
- [ ] Wishlist/Favorit
- [ ] Tanya penjual (chat)

## Troubleshooting

### Gambar tidak muncul
- Cek path gambar di folder `img/`
- Cek `photo_url` dari backend
- Pastikan server static files aktif

### Data tidak muncul
- Cek console browser untuk error
- Pastikan backend running
- Cek network tab untuk API response

### Tombol tidak berfungsi
- Pastikan `assets/js/api.js` termuat
- Cek token login di localStorage
- Cek console untuk JavaScript error

## Kontak
Untuk pertanyaan atau bug report, hubungi tim development Lautan Kita.

-- Update schema untuk tabel produk
-- Menambahkan kolom kategori, satuan, dan photo_url

USE toko_online;

-- Tambah kolom kategori (string untuk kategori produk)
ALTER TABLE produk 
ADD COLUMN IF NOT EXISTS kategori VARCHAR(50) DEFAULT NULL AFTER kategori_id;

-- Tambah kolom satuan (kg, ons, ikat, pcs)
ALTER TABLE produk 
ADD COLUMN IF NOT EXISTS satuan VARCHAR(20) DEFAULT 'kg' AFTER harga;

-- Tambah kolom photo_url (path ke foto produk)
ALTER TABLE produk 
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) DEFAULT NULL AFTER tanggal_upload;

-- Verifikasi perubahan
DESCRIBE produk;

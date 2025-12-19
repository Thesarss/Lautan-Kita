-- Update schema untuk menambahkan harga modal/HPP pada produk
-- Jalankan query ini di phpMyAdmin atau MySQL client

-- Tambah kolom harga_modal pada tabel produk
ALTER TABLE produk ADD COLUMN IF NOT EXISTS harga_modal DECIMAL(12,2) DEFAULT 0 AFTER harga;

-- Update produk yang sudah ada dengan estimasi harga modal (60-70% dari harga jual)
UPDATE produk SET harga_modal = ROUND(harga * 0.65, 0) WHERE harga_modal = 0 OR harga_modal IS NULL;

-- Verifikasi
SELECT produk_id, nama_produk, harga, harga_modal, 
       (harga - harga_modal) as margin,
       ROUND((harga - harga_modal) / harga * 100, 1) as margin_persen
FROM produk LIMIT 10;

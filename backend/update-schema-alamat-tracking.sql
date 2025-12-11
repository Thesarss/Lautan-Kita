-- Update schema untuk fitur alamat dan tracking detail
-- Run this SQL in phpMyAdmin or MySQL client

-- 1. Pastikan kolom alamat ada di tabel user (sudah ada di schema)
-- Jika belum ada, uncomment baris berikut:
-- ALTER TABLE `user` ADD COLUMN `alamat` TEXT DEFAULT NULL AFTER `no_tlp`;

-- 2. Tambah kolom untuk tracking detail di tabel pesanan
ALTER TABLE `pesanan` 
ADD COLUMN IF NOT EXISTS `kurir_id` INT(11) DEFAULT NULL AFTER `status_pesanan`,
ADD COLUMN IF NOT EXISTS `tanggal_dikemas` DATETIME DEFAULT NULL AFTER `kurir_id`,
ADD COLUMN IF NOT EXISTS `tanggal_dikirim` DATETIME DEFAULT NULL AFTER `tanggal_dikemas`,
ADD COLUMN IF NOT EXISTS `tanggal_selesai` DATETIME DEFAULT NULL AFTER `tanggal_dikirim`,
ADD COLUMN IF NOT EXISTS `ongkir` DECIMAL(12,2) DEFAULT 0 AFTER `total_harga`,
ADD COLUMN IF NOT EXISTS `catatan_kurir` TEXT DEFAULT NULL AFTER `tanggal_selesai`,
ADD COLUMN IF NOT EXISTS `lokasi_terakhir` VARCHAR(255) DEFAULT NULL AFTER `catatan_kurir`;

-- 3. Tambah foreign key untuk kurir_id jika belum ada
ALTER TABLE `pesanan` 
ADD CONSTRAINT `fk_pesanan_kurir` FOREIGN KEY (`kurir_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL;

-- 4. Tambah index untuk performa query
ALTER TABLE `pesanan` 
ADD INDEX IF NOT EXISTS `idx_pesanan_kurir` (`kurir_id`),
ADD INDEX IF NOT EXISTS `idx_pesanan_status` (`status_pesanan`);

-- 5. Update status pesanan enum untuk include 'pending'
ALTER TABLE `pesanan` 
MODIFY COLUMN `status_pesanan` ENUM('menunggu','pending','dikemas','dikirim','selesai','dibatalkan') DEFAULT 'menunggu';

-- 6. Tambah kolom avatar_url di user jika belum ada
ALTER TABLE `user` 
ADD COLUMN IF NOT EXISTS `avatar_url` VARCHAR(255) DEFAULT NULL AFTER `verified`;

-- 7. Update pembayaran table untuk tracking
ALTER TABLE `pembayaran`
ADD COLUMN IF NOT EXISTS `jumlah_bayar` DECIMAL(12,2) DEFAULT NULL AFTER `pesanan_id`,
ADD COLUMN IF NOT EXISTS `metode_pembayaran` VARCHAR(50) DEFAULT NULL AFTER `jumlah_bayar`,
ADD COLUMN IF NOT EXISTS `tanggal_pembayaran` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `metode_pembayaran`,
ADD COLUMN IF NOT EXISTS `bukti_transfer` VARCHAR(255) DEFAULT NULL AFTER `tanggal_pembayaran`,
MODIFY COLUMN `status_pembayaran` ENUM('pending','confirmed','failed') DEFAULT 'pending';

-- Done! Schema updated successfully

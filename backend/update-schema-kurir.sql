-- ============================================
-- Update Schema: Tambah Role 'kurir' ke Tabel User
-- ============================================
-- Jalankan query ini di phpMyAdmin atau MySQL client
-- Database: toko_online
-- ============================================

USE toko_online;

-- Backup data user (opsional, untuk keamanan)
-- CREATE TABLE user_backup AS SELECT * FROM user;

-- Update enum role untuk menambahkan 'kurir'
ALTER TABLE `user` 
MODIFY COLUMN `role` ENUM('pembeli', 'penjual', 'admin', 'kurir') DEFAULT 'pembeli';

-- Verifikasi perubahan
DESCRIBE `user`;

-- Test: Coba insert user dengan role kurir
-- INSERT INTO user (nama, email, password_hash, role, verified) 
-- VALUES ('Test Kurir', 'test.kurir@example.com', '$2b$10$test', 'kurir', 0);

-- Lihat semua role yang tersedia
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'toko_online' 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME = 'role';

-- Expected output: enum('pembeli','penjual','admin','kurir')

SELECT '✅ Schema berhasil diupdate! Role kurir sudah tersedia.' AS status;

-- Update schema untuk sistem tracking pesanan

-- Tambah kolom tracking di tabel pesanan
ALTER TABLE pesanan 
ADD COLUMN IF NOT EXISTS tanggal_dikemas DATETIME NULL AFTER status_pesanan,
ADD COLUMN IF NOT EXISTS tanggal_dikirim DATETIME NULL AFTER tanggal_dikemas,
ADD COLUMN IF NOT EXISTS tanggal_selesai DATETIME NULL AFTER tanggal_dikirim,
ADD COLUMN IF NOT EXISTS kurir_id INT NULL AFTER tanggal_selesai,
ADD COLUMN IF NOT EXISTS ongkir DECIMAL(10,2) DEFAULT 0 AFTER kurir_id;

-- Tambah foreign key untuk kurir
ALTER TABLE pesanan
ADD CONSTRAINT fk_pesanan_kurir 
FOREIGN KEY (kurir_id) REFERENCES user(user_id) ON DELETE SET NULL;

-- Update status_pesanan enum untuk konsistensi
ALTER TABLE pesanan 
MODIFY COLUMN status_pesanan ENUM('pending','dikemas','dikirim','selesai','dibatalkan') DEFAULT 'pending';

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_pesanan_status ON pesanan(status_pesanan);
CREATE INDEX IF NOT EXISTS idx_pesanan_kurir ON pesanan(kurir_id);
CREATE INDEX IF NOT EXISTS idx_pesanan_pembeli ON pesanan(pembeli_id);

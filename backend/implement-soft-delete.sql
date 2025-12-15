-- Add soft delete column to produk table
ALTER TABLE produk 
ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_produk_deleted_at ON produk(deleted_at);

-- Update existing queries to exclude soft-deleted products
-- This is a reference for updating application code

-- Example queries that need to be updated:

-- 1. Get active products (add WHERE deleted_at IS NULL)
-- SELECT * FROM produk WHERE status = 'aktif' AND deleted_at IS NULL;

-- 2. Get products for seller (add WHERE deleted_at IS NULL)  
-- SELECT * FROM produk WHERE penjual_id = ? AND deleted_at IS NULL;

-- 3. Get public products (add WHERE deleted_at IS NULL)
-- SELECT * FROM produk WHERE status = 'aktif' AND deleted_at IS NULL;

-- 4. Product search (add WHERE deleted_at IS NULL)
-- SELECT * FROM produk WHERE nama_produk LIKE ? AND deleted_at IS NULL;

-- Soft delete operation (instead of DELETE)
-- UPDATE produk SET deleted_at = NOW() WHERE produk_id = ? AND penjual_id = ?;

-- Restore soft-deleted product
-- UPDATE produk SET deleted_at = NULL WHERE produk_id = ? AND penjual_id = ?;

-- Get soft-deleted products (for admin/recovery)
-- SELECT * FROM produk WHERE deleted_at IS NOT NULL;

-- Permanent delete (only for admin, after archiving related data)
-- DELETE FROM produk WHERE produk_id = ? AND deleted_at IS NOT NULL;
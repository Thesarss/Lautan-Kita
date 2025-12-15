-- Add seller rating system
-- This allows buyers to rate sellers after completing orders

CREATE TABLE IF NOT EXISTS `rating_penjual` (
  `rating_id` int(11) NOT NULL AUTO_INCREMENT,
  `penjual_id` int(11) NOT NULL,
  `pembeli_id` int(11) NOT NULL,
  `pesanan_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `komentar` text DEFAULT NULL,
  `status` enum('aktif','disembunyikan') DEFAULT 'aktif',
  `dibuat_pada` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`rating_id`),
  UNIQUE KEY `unique_rating_per_order` (`pembeli_id`, `pesanan_id`, `penjual_id`),
  KEY `fk_rating_penjual` (`penjual_id`),
  KEY `fk_rating_pembeli` (`pembeli_id`),
  KEY `fk_rating_pesanan` (`pesanan_id`),
  CONSTRAINT `fk_rating_penjual` FOREIGN KEY (`penjual_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rating_pembeli` FOREIGN KEY (`pembeli_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rating_pesanan` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`pesanan_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add indexes for better performance
ALTER TABLE `rating_penjual` ADD INDEX `idx_rating_penjual_status` (`penjual_id`, `status`);
ALTER TABLE `rating_penjual` ADD INDEX `idx_rating_created` (`dibuat_pada`);

-- Add average rating cache to user table for sellers
ALTER TABLE `user` ADD COLUMN `avg_rating` decimal(3,2) DEFAULT NULL;
ALTER TABLE `user` ADD COLUMN `total_ratings` int(11) DEFAULT 0;
<?php 
  $host = 'localhost';
  $user = 'root';
  $password = '';
  $db = 'Projek-Besar';

  $conn = new mysqli($host, $user, $password, $db);
  if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
  }

  $result = $conn->query("SELECT * FROM produk LIMIT 1");
  if (!$result || $result->num_rows == 0) {
    die("Produk tidak ditemukan.");
  }

  $row = $result->fetch_assoc();

?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= htmlspecialchars($row['Nama']) ?> - Lautan Kita</title>
  <style>
    body {
      margin: 0;
      font-family: 'Segoe UI', sans-serif;
      background: #f0f8ff;
    }
    .container {
    width: 100%;
    max-width: auto;
    margin: 1rem auto;
    background: white;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem 1.5rem;
    box-sizing: border-box;
    border-radius: 10px;
    }
    .back-button {
      padding: 1rem;
      display: inline-block;
      text-decoration: none;
      font-size: 1.2rem;
      color: #0077b6;
    }
    .product-section {
      background: #0077b6;
      color: white;
      padding: 1rem;
      border-radius: 0 0 10px 10px;
    }
    .product-section img {
      width: 90%;
      border-radius: 10px;
      align: center;
    }
    .product-info {
      margin-top: 1rem;
    }
    .product-info h1 {
      margin: 0.5rem 0;
      font-size: 1.8rem;
    }
    .stars {
      color: gold;
    }
    .buy-button {
      background: white;
      color: #0077b6;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      font-size: 1rem;
    }
    .description {
      padding: 1rem;
      background: #e0f3ff;
      color: #00334e;
    }
    .description h3, .description h4 {
      margin-top: 0;
    }
    .description ul {
      list-style: none;
      padding: 0;
      margin: 0 0 1rem 0;
    }
    .description ul li::before {
      content: "✅ ";
    }
    .seller-review, .user-review {
      background: #e7f5ff;
      margin: 1rem;
      padding: 1rem;
      border-radius: 10px;
    }
    .seller-review button {
      background: #0077b6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      margin-top: 0.5rem;
      cursor: pointer;
    }
    .user-review img {
    width: 20%;
    max-width: 100%;
    height: auto;
    border-radius: 10px;
    display: block;
    margin-top: 1rem;
    }
    footer {
  background-color: #009fe3;
  color: white;
  padding: 2rem 1rem 1rem;
  margin-top: 2rem;
}

.footer-container {
  display: flex;
  flex-direction: column;
}

.footer-left,
.footer-right {
  margin-bottom: 1.5rem;
}

.footer-left h4,
.footer-right h4 {
  font-weight: 700;
}

.footer-nav {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  font-weight: bold;
}

.footer-nav a {
  color: white;
  text-decoration: none;
  transition: color 0.3s ease, font-weight 0.3s ease;
  font-weight: normal;
}

.footer-nav a:hover {
  color: white;
  text-decoration: underline;
}

.footer-nav a.active {
  font-weight: 700; /* bold */
}

footer p {
  margin: 4px 0;
}

footer .copyright {
  text-align: center;
  margin-top: 1rem;
  font-size: 12px;
  opacity: 0.7;
}
  </style>
</head>
<body>
  <div class="container">
    <a class="back-button" href="#">⬅️ Kembali</a>

    <div class="product-section">
      <img src="ikanbelanak.png" alt="Ikan Belanak" />
      <div class="product-info">
        <h1><?= htmlspecialchars($row['Nama']) ?></h1>
        <p>Rp. <?= number_format($row['Harga']) ?>/kg</p>
        <p>Stok: <?= htmlspecialchars($row['Stok']) ?> kg</p>
        <div class="stars"><?= str_repeat("★", round($row['rating'])) ?></div>
        <button class="buy-button">🛒 Beli Sekarang</button>
      </div>
    </div>

    <div class="description">
      <h3>Deskripsi Produk</h3>
      <p><?= htmlspecialchars($row['deskripsi']) ?></p>
      <ul>
        <li>Status: <?= htmlspecialchars($row['status']) ?></li>
        <li>Kategori: <?= htmlspecialchars($row['kategori']) ?></li>
      </ul>
      <h4>Spesifikasi:</h4>
      <ul>
        <li>Ukuran: <?= htmlspecialchars($row['ukuran']) ?></li>
        <li>Berat: <?= htmlspecialchars($row['berat']) ?></li>
        <li>Asal: <?= htmlspecialchars($row['asal']) ?></li>
        <li>Penyimpanan: <?= htmlspecialchars($row['penyimpanan']) ?></li>
      </ul>
      <p>🚚 Siap Kirim! Kami siap melayani pengiriman cepat.</p>
    </div>

    <div class="seller-review">
      <strong><?= htmlspecialchars($row['penjual']) ?></strong><br>
      Penjual terpercaya<br>
      <button>Kunjungi</button>
      <div class="stars"><?= str_repeat("★", round($row['rating'])) ?></div>
    </div>

    <div class="user-review">
      <strong>Santi</strong>
      <p><?= htmlspecialchars($row['review']) ?></p>
      <div class="stars"><?= str_repeat("★", round($row['rating'])) ?></div>
      <img src="ikanbelanak.png" alt="Ikan Belanak" />
    </div>

      <footer>
    <div class="footer-container">
      <div class="footer-left">
        <h4>Lautan Kita</h4>
        <p>
          Lautan Kita adalah platform digital inovatif yang menghubungkan nelayan lokal langsung dengan konsumen dan bisnis, menyediakan produk laut segar, transparan, dan berkelanjutan.
        </p>
        <style>
          .footer-nav a {
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
          }
        
          .footer-nav a:hover {
            color: white;
            text-decoration: underline;
          }
        </style>
        
        <div class="footer-nav">
          <h5><a href="index.html" class="footer-link">Beranda</a></h5>
          <h5><a href="keranjang.html" class="footer-link">Keranjang</a></h5>
          <h5><a href="pusat-bantuan.html" class="footer-link">Pusat Bantuan</a></h5>
        </div>                      
      </div>
      <div class="footer-right">
        <h4>Kontak Kami:</h4>
        <p>📸 @lautankita</p>
        <p>🎵 @lautankita</p>
        <p>📞 +62 811 1234 5678</p>
        <p>✉️ lautankita@gmail.com</p>
        <h4>Alamat:</h4>
        <p>📍 Ganet, BT 11, Tanjung Pinang Timur, Tanjung Pinang, Kepulauan Riau</p>
      </div>
    </div>
    <p class="copyright">© 2025 Lautan Kita. All rights reserved</p>
  </footer>
  </div>
</body>
</html>

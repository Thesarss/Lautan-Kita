# Requirements Document

## Introduction

Fitur ini meningkatkan sistem laporan transaksi penjualan di admin panel Lautan Kita dengan menambahkan filter harian dan bulanan yang lebih terstruktur, serta menampilkan data-data penting untuk analisis penjualan. Fitur ini memungkinkan admin untuk melihat ringkasan penjualan berdasarkan periode waktu tertentu dengan data yang lebih komprehensif.

## Glossary

- **Admin Panel**: Halaman dashboard untuk administrator sistem
- **Laporan Transaksi**: Ringkasan data transaksi penjualan dalam periode tertentu
- **Filter Harian**: Filter untuk menampilkan data transaksi per hari
- **Filter Bulanan**: Filter untuk menampilkan data transaksi per bulan
- **Ringkasan Penjualan**: Agregasi data penjualan termasuk total pendapatan, jumlah transaksi, dan statistik lainnya
- **Periode Laporan**: Rentang waktu yang dipilih untuk menampilkan data laporan

## Requirements

### Requirement 1

**User Story:** Sebagai admin, saya ingin memfilter laporan transaksi berdasarkan periode harian, sehingga saya dapat menganalisis performa penjualan harian.

#### Acceptance Criteria

1. WHEN admin memilih filter "Harian" THEN Sistem Laporan SHALL menampilkan dropdown untuk memilih tanggal spesifik
2. WHEN admin memilih tanggal tertentu THEN Sistem Laporan SHALL menampilkan semua transaksi pada tanggal tersebut
3. WHEN filter harian diterapkan THEN Sistem Laporan SHALL menampilkan ringkasan total penjualan hari tersebut
4. WHEN tidak ada transaksi pada tanggal yang dipilih THEN Sistem Laporan SHALL menampilkan pesan "Tidak ada transaksi pada tanggal ini"

### Requirement 2

**User Story:** Sebagai admin, saya ingin memfilter laporan transaksi berdasarkan periode bulanan, sehingga saya dapat menganalisis tren penjualan bulanan.

#### Acceptance Criteria

1. WHEN admin memilih filter "Bulanan" THEN Sistem Laporan SHALL menampilkan dropdown untuk memilih bulan dan tahun
2. WHEN admin memilih bulan tertentu THEN Sistem Laporan SHALL menampilkan semua transaksi pada bulan tersebut
3. WHEN filter bulanan diterapkan THEN Sistem Laporan SHALL menampilkan ringkasan total penjualan bulan tersebut
4. WHEN tidak ada transaksi pada bulan yang dipilih THEN Sistem Laporan SHALL menampilkan pesan "Tidak ada transaksi pada bulan ini"

### Requirement 3

**User Story:** Sebagai admin, saya ingin melihat data-data penting dalam laporan transaksi, sehingga saya dapat membuat keputusan bisnis yang tepat.

#### Acceptance Criteria

1. WHEN laporan transaksi ditampilkan THEN Sistem Laporan SHALL menampilkan total pendapatan dalam periode yang dipilih
2. WHEN laporan transaksi ditampilkan THEN Sistem Laporan SHALL menampilkan jumlah transaksi berhasil, pending, dan gagal
3. WHEN laporan transaksi ditampilkan THEN Sistem Laporan SHALL menampilkan rata-rata nilai transaksi
4. WHEN laporan transaksi ditampilkan THEN Sistem Laporan SHALL menampilkan produk terlaris dalam periode tersebut
5. WHEN laporan transaksi ditampilkan THEN Sistem Laporan SHALL menampilkan penjual dengan penjualan tertinggi

### Requirement 4

**User Story:** Sebagai admin, saya ingin membandingkan data penjualan antar periode, sehingga saya dapat melihat pertumbuhan atau penurunan penjualan.

#### Acceptance Criteria

1. WHEN filter harian diterapkan THEN Sistem Laporan SHALL menampilkan perbandingan dengan hari sebelumnya
2. WHEN filter bulanan diterapkan THEN Sistem Laporan SHALL menampilkan perbandingan dengan bulan sebelumnya
3. WHEN terjadi peningkatan penjualan THEN Sistem Laporan SHALL menampilkan indikator positif berwarna hijau dengan persentase kenaikan
4. WHEN terjadi penurunan penjualan THEN Sistem Laporan SHALL menampilkan indikator negatif berwarna merah dengan persentase penurunan

### Requirement 5

**User Story:** Sebagai admin, saya ingin mengekspor laporan transaksi dengan filter yang diterapkan, sehingga saya dapat menyimpan dan membagikan laporan.

#### Acceptance Criteria

1. WHEN admin mengklik tombol export THEN Sistem Laporan SHALL menghasilkan file CSV dengan data sesuai filter yang aktif
2. WHEN file CSV dihasilkan THEN Sistem Laporan SHALL menyertakan header periode laporan dan tanggal export
3. WHEN file CSV dihasilkan THEN Sistem Laporan SHALL menyertakan ringkasan statistik di bagian atas file
4. WHEN file CSV dihasilkan THEN Sistem Laporan SHALL menyertakan detail setiap transaksi dalam periode tersebut

### Requirement 6

**User Story:** Sebagai admin, saya ingin melihat grafik visualisasi penjualan, sehingga saya dapat memahami tren dengan lebih mudah.

#### Acceptance Criteria

1. WHEN filter harian diterapkan THEN Sistem Laporan SHALL menampilkan grafik penjualan per jam dalam hari tersebut
2. WHEN filter bulanan diterapkan THEN Sistem Laporan SHALL menampilkan grafik penjualan per hari dalam bulan tersebut
3. WHEN grafik ditampilkan THEN Sistem Laporan SHALL menampilkan tooltip dengan detail nilai saat hover
4. WHEN data kosong THEN Sistem Laporan SHALL menampilkan grafik kosong dengan pesan informatif

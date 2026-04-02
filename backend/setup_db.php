<?php
$host = 'localhost';
$user = 'root';
$pass = '';

// Create connection without selecting DB
$conn = new mysqli($host, $user, $pass);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\nPastikan MySQL Laragon sudah Start.\n");
}

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS burgerlicious";
if ($conn->query($sql) === TRUE) {
    echo "Database burgerlicious berhasil dibuat atau sudah ada.\n";
} else {
    die("Error creating database: " . $conn->error . "\n");
}

// Select the database
$conn->select_db("burgerlicious");

// Create table based on our needs
$sql_table = "CREATE TABLE IF NOT EXISTS `user` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_code` varchar(6) DEFAULT NULL,
  `code_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_table) === TRUE) {
    echo "Tabel user berhasil dibuat/dikonfirmasi siap!\n";
} else {
    die("Error creating table user: " . $conn->error . "\n");
}

// Create orders table
$sql_orders = "CREATE TABLE IF NOT EXISTS `pesanan` (
  `id_pesanan` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) DEFAULT NULL,
  `menu_nama` varchar(100) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `alamat` text NOT NULL,
  `pengiriman` varchar(100) NOT NULL,
  `pembayaran` varchar(100) NOT NULL,
  `catatan` text DEFAULT NULL,
  `total_harga` int(11) NOT NULL,
  `tanggal_pesan` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pesanan`),
  KEY `fk_user_pesanan` (`id_user`),
  CONSTRAINT `fk_user_pesanan` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_orders) === TRUE) {
    echo "Tabel pesanan berhasil dibuat/dikonfirmasi siap!\n";
} else {
    die("Error creating table pesanan: " . $conn->error . "\n");
}

$conn->close();
echo "SUKSES! Database lokal sudah siap digunakan untuk registrasi.\n";
?>

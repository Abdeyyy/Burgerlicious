<?php
$host = 'db';
$user = 'root';
$pass = 'rootpassword';

$conn = new mysqli($host, $user, $pass);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\nPastikan MySQL Laragon sudah Start.\n");
}

$sql = "CREATE DATABASE IF NOT EXISTS burgerlicious";
if ($conn->query($sql) === TRUE) {
    echo "Database burgerlicious berhasil dibuat atau sudah ada.\n";
} else {
    die("Error creating database: " . $conn->error . "\n");
}

$conn->select_db("burgerlicious");

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
    die("Error creating table: " . $conn->error . "\n");
}

$conn->close();
echo "SUKSES! Database lokal sudah siap digunakan untuk registrasi.\n";
?>

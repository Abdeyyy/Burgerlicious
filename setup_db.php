<?php
// Konfigurasi untuk Docker
$host_docker = 'db';
$user_docker = 'root';
$pass_docker = 'rootpassword';

// Konfigurasi untuk Laragon/XAMPP (Lokal)
$host_local = 'localhost';
$user_local = 'root';
$pass_local = '';

mysqli_report(MYSQLI_REPORT_OFF);

// Coba koneksi ke Docker
$conn = @new mysqli($host_docker, $user_docker, $pass_docker);

if ($conn->connect_error) {
    // Jika gagal ke Docker, coba koneksi ke Laragon/Lokal
    $conn = @new mysqli($host_local, $user_local, $pass_local);
    
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error . "\nPastikan MySQL Laragon sudah Start atau container Docker berjalan.\n");
    }
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

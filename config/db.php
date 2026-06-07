<?php
$db_name = 'burgerlicious';

// Konfigurasi untuk Docker
$host_docker = 'db';
$user_docker = 'root';
$pass_docker = 'rootpassword';

// Konfigurasi untuk Laragon/XAMPP (Lokal)
$host_local = 'localhost';
$user_local = 'root';
$pass_local = ''; 

// Matikan exception otomatis untuk mysqli agar bisa ditangkap dengan gracefully
mysqli_report(MYSQLI_REPORT_OFF);

// Matikan display_errors agar warning/notice PHP tidak merusak output JSON
ini_set('display_errors', 0);

// Coba koneksi ke Docker
$conn = @new mysqli($host_docker, $user_docker, $pass_docker, $db_name);

if ($conn->connect_error) {
    // Jika gagal ke Docker, coba koneksi ke Laragon/Lokal
    $conn = @new mysqli($host_local, $user_local, $pass_local, $db_name);
    
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal (Docker & Lokal): ' . $conn->connect_error]);
        exit;
    }
}

$conn->set_charset('utf8mb4');

// Set timezone to Asia/Jakarta (WIB)
date_default_timezone_set('Asia/Jakarta');
$conn->query("SET time_zone = '+07:00'");

// Pastikan tabel remember_tokens tersedia secara dinamis
$conn->query("CREATE TABLE IF NOT EXISTS `remember_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `selector` varchar(16) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `selector` (`selector`),
  KEY `fk_remember_user` (`id_user`),
  CONSTRAINT `fk_remember_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
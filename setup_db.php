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
  `role` enum('customer','admin') DEFAULT 'customer',
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_code` varchar(6) DEFAULT NULL,
  `code_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_table) === TRUE) {
    echo "Tabel user berhasil dibuat/dikonfirmasi siap!\n";
    
    // Cek apakah kolom role sudah ada
    $check_column = $conn->query("SHOW COLUMNS FROM `user` LIKE 'role'");
    if ($check_column->num_rows == 0) {
        $conn->query("ALTER TABLE `user` ADD `role` enum('customer','admin') DEFAULT 'customer' AFTER `pass` ");
        echo "Kolom 'role' berhasil ditambahkan.\n";
    }
} else {
    die("Error creating table: " . $conn->error . "\n");
}

// Tambahkan User Admin Default
$admin_email = 'admin@burgerlicious.com';
$admin_pass  = password_hash('admin123', PASSWORD_DEFAULT);
$admin_nama  = 'Administrator';

$check_admin = $conn->query("SELECT id_user FROM user WHERE email = '$admin_email'");
if ($check_admin->num_rows == 0) {
    $sql_admin = "INSERT INTO user (nama, email, pass, role, is_verified) VALUES ('$admin_nama', '$admin_email', '$admin_pass', 'admin', 1)";
    if ($conn->query($sql_admin) === TRUE) {
        echo "User Admin default berhasil dibuat: $admin_email / admin123\n";
    } else {
        echo "Gagal membuat user admin: " . $conn->error . "\n";
    }
}

$conn->close();
echo "SUKSES! Database lokal sudah siap digunakan untuk registrasi dan login admin.\n";
?>

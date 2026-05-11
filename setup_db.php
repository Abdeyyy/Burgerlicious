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

// Pastikan kolom verification_code & code_expires_at nullable (fix untuk DB yang sudah ada)
$conn->query("ALTER TABLE `user` MODIFY `verification_code` varchar(6) DEFAULT NULL");
$conn->query("ALTER TABLE `user` MODIFY `code_expires_at` datetime DEFAULT NULL");

if ($conn->query($sql_table) === TRUE) {
    echo "Tabel user berhasil dibuat/dikonfirmasi siap!\n";
    
    // Cek apakah kolom role sudah ada
    $check_column = $conn->query("SHOW COLUMNS FROM `user` LIKE 'role'");
    if ($check_column->num_rows == 0) {
        $conn->query("ALTER TABLE `user` ADD `role` enum('customer','admin') DEFAULT 'customer' AFTER `pass` ");
        echo "Kolom 'role' berhasil ditambahkan.\n";
    }
} else {
    die("Error creating table user: " . $conn->error . "\n");
}

// Tambah Tabel Kategori Menu
$sql_kategori = "CREATE TABLE IF NOT EXISTS `kategori_menu` (
  `id_kategori` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kategori` varchar(100) NOT NULL,
  PRIMARY KEY (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_kategori) === TRUE) {
    echo "Tabel kategori_menu siap!\n";
    
    // Tambah Kategori Default jika kosong
    $check_kat = $conn->query("SELECT id_kategori FROM kategori_menu LIMIT 1");
    if ($check_kat->num_rows == 0) {
        $conn->query("INSERT INTO kategori_menu (nama_kategori) VALUES ('Burgers'), ('Sides'), ('Drinks'), ('Desserts')");
        echo "Kategori default ditambahkan.\n";
    }
} else {
    die("Error creating table kategori_menu: " . $conn->error . "\n");
}

// Tambah Tabel Menu
$sql_menu = "CREATE TABLE IF NOT EXISTS `menu` (
  `id_menu` int(11) NOT NULL AUTO_INCREMENT,
  `id_kategori` int(11) NOT NULL,
  `nama_menu` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga` decimal(10,2) NOT NULL,
  `gambar_url` varchar(255) DEFAULT NULL,
  `status_tersedia` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_menu`),
  KEY `fk_kategori` (`id_kategori`),
  CONSTRAINT `fk_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori_menu` (`id_kategori`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_menu) === TRUE) {
    echo "Tabel menu siap!\n";
} else {
    die("Error creating table menu: " . $conn->error . "\n");
}

// Tambahkan User Admin Default
$admin_email = 'admin@burgerlicious.com';
$admin_pass  = password_hash('admin123', PASSWORD_DEFAULT);
$admin_nama  = 'Administrator';

$check_admin = $conn->query("SELECT id_user FROM user WHERE email = '$admin_email'");
if ($check_admin->num_rows == 0) {
    $sql_admin = "INSERT INTO user (nama, email, pass, role, is_verified, verification_code, code_expires_at) VALUES ('$admin_nama', '$admin_email', '$admin_pass', 'admin', 1, NULL, NULL)";
    if ($conn->query($sql_admin) === TRUE) {
        echo "User Admin default berhasil dibuat: $admin_email / admin123\n";
    } else {
        echo "Gagal membuat user admin: " . $conn->error . "\n";
    }
}

$conn->close();
echo "SUKSES! Database lokal sudah siap digunakan untuk registrasi dan login admin.\n";
?>

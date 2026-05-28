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
  `reset_code` varchar(6) DEFAULT NULL,
  `reset_expires_at` datetime DEFAULT NULL,
  `telepon` varchar(15) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// Pastikan kolom verification_code & code_expires_at nullable (fix untuk DB yang sudah ada)
$conn->query("ALTER TABLE `user` MODIFY `verification_code` varchar(6) DEFAULT NULL");
$conn->query("ALTER TABLE `user` MODIFY `code_expires_at` datetime DEFAULT NULL");

// Pastikan kolom reset_code & reset_expires_at ada
$check_reset_code = $conn->query("SHOW COLUMNS FROM `user` LIKE 'reset_code'");
if ($check_reset_code->num_rows == 0) {
    $conn->query("ALTER TABLE `user` ADD `reset_code` varchar(6) DEFAULT NULL AFTER `code_expires_at`");
    $conn->query("ALTER TABLE `user` ADD `reset_expires_at` datetime DEFAULT NULL AFTER `reset_code`");
    echo "Kolom 'reset_code' dan 'reset_expires_at' berhasil ditambahkan.\n";
}

// Pastikan kolom telepon, alamat, dan foto_profil ada (Tugas 1.1)
$check_telepon = $conn->query("SHOW COLUMNS FROM `user` LIKE 'telepon'");
if ($check_telepon->num_rows == 0) {
    $conn->query("ALTER TABLE `user` ADD `telepon` varchar(15) DEFAULT NULL AFTER `reset_expires_at`");
    $conn->query("ALTER TABLE `user` ADD `alamat` text DEFAULT NULL AFTER `telepon`");
    $conn->query("ALTER TABLE `user` ADD `foto_profil` varchar(255) DEFAULT NULL AFTER `alamat`");
    echo "Kolom 'telepon', 'alamat', dan 'foto_profil' berhasil ditambahkan ke tabel user.\n";
}

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

// Tambah Tabel Remember Tokens
$sql_remember = "CREATE TABLE IF NOT EXISTS `remember_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `selector` varchar(16) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `selector` (`selector`),
  KEY `fk_remember_user` (`id_user`),
  CONSTRAINT `fk_remember_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_remember) === TRUE) {
    echo "Tabel remember_tokens siap!\n";
} else {
    die("Error creating table remember_tokens: " . $conn->error . "\n");
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

// Tambah Tabel Transaksi
$sql_transaksi = "CREATE TABLE IF NOT EXISTS `transaksi` (
  `id_transaksi` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) DEFAULT NULL,
  `nama_pelanggan` varchar(100) NOT NULL,
  `tipe_pesanan` enum('dine-in','takeaway') NOT NULL DEFAULT 'dine-in',
  `status_pesanan` enum('pending','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  `total_harga` decimal(10,2) NOT NULL,
  `tanggal_transaksi` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_transaksi`),
  KEY `fk_user_transaksi` (`id_user`),
  CONSTRAINT `fk_user_transaksi` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_transaksi) === TRUE) {
    echo "Tabel transaksi siap!\n";
    
    // Migrasi: tambah kolom id_user jika belum ada (untuk DB yang sudah existing)
    $check_col = $conn->query("SHOW COLUMNS FROM `transaksi` LIKE 'id_user'");
    if ($check_col->num_rows == 0) {
        $conn->query("ALTER TABLE `transaksi` ADD `id_user` int(11) DEFAULT NULL AFTER `id_transaksi`");
        $conn->query("ALTER TABLE `transaksi` ADD KEY `fk_user_transaksi` (`id_user`)");
        // Tambah FK hanya jika belum ada
        $conn->query("ALTER TABLE `transaksi` ADD CONSTRAINT `fk_user_transaksi` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE SET NULL");
        echo "Kolom 'id_user' berhasil ditambahkan ke tabel transaksi.\n";
    }
} else {
    die("Error creating table transaksi: " . $conn->error . "\n");
}

// Tambah Tabel Detail Transaksi
$sql_detail = "CREATE TABLE IF NOT EXISTS `detail_transaksi` (
  `id_detail` int(11) NOT NULL AUTO_INCREMENT,
  `id_transaksi` int(11) NOT NULL,
  `id_menu` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `harga_satuan` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detail`),
  KEY `fk_transaksi` (`id_transaksi`),
  KEY `fk_menu_transaksi` (`id_menu`),
  CONSTRAINT `fk_transaksi` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE CASCADE,
  CONSTRAINT `fk_menu_transaksi` FOREIGN KEY (`id_menu`) REFERENCES `menu` (`id_menu`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_detail) === TRUE) {
    echo "Tabel detail_transaksi siap!\n";
} else {
    die("Error creating table detail_transaksi: " . $conn->error . "\n");
}

// Tambah Tabel Promo
$sql_promo = "CREATE TABLE IF NOT EXISTS `promo` (
  `id_promo` int(11) NOT NULL AUTO_INCREMENT,
  `nama_promo` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `tipe_promo` enum('percentage','fixed','bogo') NOT NULL,
  `nilai_diskon` decimal(10,2) NOT NULL DEFAULT 0,
  `kode_promo` varchar(50) DEFAULT NULL,
  `min_order` decimal(10,2) DEFAULT 0,
  `max_usage` int(11) DEFAULT NULL,
  `current_usage` int(11) DEFAULT 0,
  `id_kategori_target` int(11) DEFAULT NULL,
  `gambar_url` varchar(255) DEFAULT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_promo`),
  UNIQUE KEY `kode_promo_unique` (`kode_promo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_promo) === TRUE) {
    echo "Tabel promo siap!\n";

    // Tambah FK ke kategori jika belum ada
    $check_fk = $conn->query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = 'burgerlicious' AND TABLE_NAME = 'promo' AND CONSTRAINT_NAME = 'fk_promo_kategori'");
    if ($check_fk->num_rows == 0) {
        $conn->query("ALTER TABLE `promo` ADD KEY `fk_promo_kategori` (`id_kategori_target`)");
        $conn->query("ALTER TABLE `promo` ADD CONSTRAINT `fk_promo_kategori` FOREIGN KEY (`id_kategori_target`) REFERENCES `kategori_menu` (`id_kategori`) ON DELETE SET NULL");
    }
} else {
    die("Error creating table promo: " . $conn->error . "\n");
}

// Tambah Tabel Promo Usage (tracking penggunaan per transaksi)
$sql_promo_usage = "CREATE TABLE IF NOT EXISTS `promo_usage` (
  `id_usage` int(11) NOT NULL AUTO_INCREMENT,
  `id_promo` int(11) NOT NULL,
  `id_transaksi` int(11) NOT NULL,
  `nilai_potongan` decimal(10,2) NOT NULL,
  `tanggal_digunakan` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usage`),
  KEY `fk_usage_promo` (`id_promo`),
  KEY `fk_usage_transaksi` (`id_transaksi`),
  CONSTRAINT `fk_usage_promo` FOREIGN KEY (`id_promo`) REFERENCES `promo` (`id_promo`) ON DELETE CASCADE,
  CONSTRAINT `fk_usage_transaksi` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if ($conn->query($sql_promo_usage) === TRUE) {
    echo "Tabel promo_usage siap!\n";
} else {
    die("Error creating table promo_usage: " . $conn->error . "\n");
}

// Migrasi: tambah kolom id_promo dan nilai_diskon di transaksi jika belum ada
$check_promo_col = $conn->query("SHOW COLUMNS FROM `transaksi` LIKE 'id_promo'");
if ($check_promo_col->num_rows == 0) {
    $conn->query("ALTER TABLE `transaksi` ADD `id_promo` int(11) DEFAULT NULL AFTER `total_harga`");
    $conn->query("ALTER TABLE `transaksi` ADD `nilai_diskon` decimal(10,2) DEFAULT 0 AFTER `id_promo`");
    echo "Kolom 'id_promo' dan 'nilai_diskon' berhasil ditambahkan ke tabel transaksi.\n";
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

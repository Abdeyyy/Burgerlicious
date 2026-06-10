<?php
// Google reCAPTCHA v2 Keys
define('RECAPTCHA_SITE_KEY', '6LcJuhYtAAAAAN-dq6VctLa_gdt7LS-1NYNvaGZW');
define('RECAPTCHA_SECRET_KEY', '6LcJuhYtAAAAANxMIZe3P__gmChpNV3Q8MrCYAXh');

// Matikan exception otomatis untuk mysqli agar bisa ditangkap secara gracefully
mysqli_report(MYSQLI_REPORT_OFF);

// Matikan display_errors agar warning/notice PHP tidak merusak output JSON
ini_set('display_errors', 0);

// Deteksi lingkungan: apakah lokal (XAMPP/Laragon/Docker) atau hosting
$is_local = false;
$http_host = $_SERVER['HTTP_HOST'] ?? '';

if (empty($http_host) || in_array($http_host, ['localhost', '127.0.0.1']) || strpos($http_host, 'localhost:') === 0 || strpos($http_host, '127.0.0.1:') === 0) {
    $is_local = true;
}

if (!$is_local) {
    $db_host = $_ENV['MYSQL_ADDON_HOST'] ?? getenv('MYSQL_ADDON_HOST') ?: 'localhost'; 
    $db_user = $_ENV['MYSQL_ADDON_USER'] ?? getenv('MYSQL_ADDON_USER');
    $db_pass = $_ENV['MYSQL_ADDON_PASSWORD'] ?? getenv('MYSQL_ADDON_PASSWORD');
    $db_name = $_ENV['MYSQL_ADDON_DB'] ?? getenv('MYSQL_ADDON_DB');
    $db_port = $_ENV['MYSQL_ADDON_PORT'] ?? getenv('MYSQL_ADDON_PORT') ?: 3306;
} else {
    $db_host = 'db';
    $db_user = 'root';
    $db_pass = 'rootpassword';
    $db_name = 'burgerlicious';

    $conn_test = @new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn_test->connect_error) {
        $db_host = '127.0.0.1'; 
        $db_user = 'root';
        $db_pass = '';
        $db_name = 'burgerlicious';
    } else {
        $conn_test->close();
    }
}

// Lakukan koneksi final
$db_port = $is_local ? 3306 : ($db_port ?? 3306);
$conn = @new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);

if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Koneksi database gagal (' . $db_host . '): ' . ($conn ? $conn->connect_error : 'Koneksi tidak terinisialisasi')
    ]);
    exit;
}

$conn->set_charset('utf8mb4');

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

// Pastikan kolom id_menu_target pada tabel promo tersedia secara dinamis
$check_menu_target = $conn->query("SHOW COLUMNS FROM `promo` LIKE 'id_menu_target'");
if ($check_menu_target && $check_menu_target->num_rows == 0) {
    $conn->query("ALTER TABLE `promo` ADD COLUMN id_menu_target INT DEFAULT NULL AFTER id_kategori_target");
    $conn->query("ALTER TABLE `promo` ADD CONSTRAINT fk_promo_menu FOREIGN KEY (id_menu_target) REFERENCES menu(id_menu) ON DELETE SET NULL");
}
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
    // -------------------------------------------------------------
    // KONEKSI LIVE SERVER (INFINITYFREE)
    // -------------------------------------------------------------
    // PENTING: Di InfinityFree, jangan gunakan 'localhost' sebagai host database!
    // Gunakan MySQL Hostname yang tertera di Control Panel InfinityFree Anda.
    $db_host = 'sql100.infinityfree.com'; // Sesuaikan jika host akun Anda berbeda
    $db_user = 'if0_41496213';
    $db_pass = 'BgEwbUd9M7kd';
    $db_name = 'if0_41496213_burgerlicious';
} else {
    // -------------------------------------------------------------
    // KONEKSI LOKAL (XAMPP / LARAGON / DOCKER)
    // -------------------------------------------------------------
    // Coba koneksi ke Docker db first
    $db_host = 'db';
    $db_user = 'root';
    $db_pass = 'rootpassword';
    $db_name = 'burgerlicious';

    $conn_test = @new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn_test->connect_error) {
        // Fallback ke Laragon/XAMPP Lokal jika Docker tidak aktif
        $db_host = '127.0.0.1'; // Menggunakan 127.0.0.1 mencegah error socket
        $db_user = 'root';
        $db_pass = '';
        $db_name = 'burgerlicious';
    } else {
        $conn_test->close();
    }
}

// Lakukan koneksi final
$conn = @new mysqli($db_host, $db_user, $db_pass, $db_name);

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
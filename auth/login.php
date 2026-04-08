<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Jika ada yang mencoba mengakses file ini langsung dari URL (metode GET), kita blokir.
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Email dan password harus diisi.']);
    exit;
}

// 1. Mencari data user berdasarkan email yang disubmit
// Menggunakan prepare statement (?) untuk mencegah serangan SQL Injection
$stmt = $conn->prepare('SELECT * FROM user WHERE email = ?');
$stmt->bind_param('s', $email); // 's' berarti parameter berupa string
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc(); // Mengambil data 1 baris sebagai array (associative)
$stmt->close();

// 2. Verifikasi Password
// Jika email tidak ditemukan (!$user) ATAU password salah (menggunakan fungsi password_verify bawahan PHP untuk mencocokkan hash password)
if (!$user || !password_verify($password, $user['pass'])) {
    echo json_encode(['status' => 'error', 'message' => 'Email atau password salah.']);
    exit;
}

if (isset($user['is_verified']) && $user['is_verified'] == 0) {
    echo json_encode(['status' => 'error', 'message' => 'Akun belum diverifikasi. Cek email Anda untuk OTP.']);
    exit;
}

// 4. Set Sesi (Session) User Aktif
// Menyimpan data penting user di memori server agar status loginnya terjaga selama browsing
$_SESSION['user_id'] = $user['id_user'];
$_SESSION['nama']    = $user['nama'];
$_SESSION['email']   = $user['email'];

echo json_encode([
    'status'  => 'success',
    'message' => 'Login berhasil!',
    'nama'    => $user['nama']
]);
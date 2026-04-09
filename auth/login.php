<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Email dan password harus diisi.']);
    exit;
}

// Mencari data user berdasarkan email yang disubmit
$stmt = $conn->prepare('SELECT * FROM user WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// Verifikasi Password
if (!$user || !password_verify($password, $user['pass'])) {
    echo json_encode(['status' => 'error', 'message' => 'Email atau password salah.']);
    exit;
}

if (isset($user['is_verified']) && $user['is_verified'] == 0) {
    echo json_encode(['status' => 'error', 'message' => 'Akun belum diverifikasi. Cek email Anda untuk OTP.']);
    exit;
}

// Set Sesi
$_SESSION['user_id'] = $user['id_user'];
$_SESSION['nama']    = $user['nama'];
$_SESSION['email']   = $user['email'];

echo json_encode([
    'status'  => 'success',
    'message' => 'Login berhasil!',
    'nama'    => $user['nama']
]);
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

// Validasi
if (!$email || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Email dan password harus diisi.']);
    exit;
}

// Cari user
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['status' => 'error', 'message' => 'Email atau password salah.']);
    exit;
}

// Simpan session
$_SESSION['user_id'] = $user['id'];
$_SESSION['nama']    = $user['nama'];
$_SESSION['email']   = $user['email'];

echo json_encode([
    'status'  => 'success',
    'message' => 'Login berhasil!',
    'nama'    => $user['nama']
]);
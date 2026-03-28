<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$nama     = trim($_POST['nama'] ?? '');
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$confirm  = $_POST['confirmPassword'] ?? '';

if (!$nama || !$email || !$password || !$confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Semua field harus diisi.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Format email tidak valid.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password minimal 6 karakter.']);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Password tidak cocok.']);
    exit;
}

$stmt = $conn->prepare('SELECT id_user FROM user WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(['status' => 'error', 'message' => 'Email sudah terdaftar.']);
    exit;
}
$stmt->close();

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO user (nama, email, pass) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $nama, $email, $hash);
$stmt->execute();
$stmt->close();

echo json_encode(['status' => 'success', 'message' => 'Registrasi berhasil! Silakan login.']);
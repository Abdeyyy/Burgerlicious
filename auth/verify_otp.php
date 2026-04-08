<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
session_start();
date_default_timezone_set('Asia/Jakarta');
header('Content-Type: application/json');
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$otp   = trim($_POST['otp'] ?? '');

if (!$email || !$otp) {
    echo json_encode(['status' => 'error', 'message' => 'Email dan OTP harus diisi.']);
    exit;
}

try {
    $stmt = $conn->prepare('SELECT id_user, is_verified, verification_code, code_expires_at FROM user WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'Email tidak terdaftar.']);
        exit;
    }

    if ($user['is_verified'] == 1) {
        echo json_encode(['status' => 'error', 'message' => 'Akun sudah diverifikasi sebelumnya.']);
        exit;
    }

    if ($user['verification_code'] !== $otp) {
        echo json_encode(['status' => 'error', 'message' => 'Kode OTP salah.']);
        exit;
    }

    $current_time = date('Y-m-d H:i:s');
    if ($current_time > $user['code_expires_at']) {
        echo json_encode(['status' => 'error', 'message' => 'Kode OTP sudah kadaluwarsa. Silakan mendaftar ulang atau minta OTP baru.']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE user SET is_verified = 1, verification_code = '', code_expires_at = '2000-01-01 00:00:00' WHERE email = ?");
    $stmt->bind_param('s', $email);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Verifikasi berhasil! Mengalihkan ke halaman login...']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan sistem saat memverifikasi.']);
    }

    $stmt->close();
} catch (Throwable $e) {
    echo json_encode(['status' => 'error', 'message' => 'FATAL PHP ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()]);
    exit;
}
$conn->close();
?>

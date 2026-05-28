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

$email    = trim($_POST['email'] ?? '');
$otp      = trim($_POST['otp'] ?? '');
$password = $_POST['password'] ?? '';
$confirm  = $_POST['confirmPassword'] ?? '';

if (!$email || !$otp || !$password || !$confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Semua kolom harus diisi.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password minimal 6 karakter.']);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Konfirmasi password tidak cocok.']);
    exit;
}

try {
    // Ambil data user
    $stmt = $conn->prepare('SELECT id_user, reset_code, reset_expires_at FROM user WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'Email tidak terdaftar.']);
        exit;
    }

    if (empty($user['reset_code']) || $user['reset_code'] !== $otp) {
        echo json_encode(['status' => 'error', 'message' => 'Kode OTP salah atau belum diminta.']);
        exit;
    }

    $current_time = date('Y-m-d H:i:s');
    if ($current_time > $user['reset_expires_at']) {
        echo json_encode(['status' => 'error', 'message' => 'Kode OTP sudah kadaluwarsa. Silakan minta kode baru.']);
        exit;
    }

    // Buat hash password baru
    $hash = password_hash($password, PASSWORD_DEFAULT);

    // Update password dan kosongkan kolom reset
    $stmt_upd = $conn->prepare("UPDATE user SET pass = ?, reset_code = NULL, reset_expires_at = NULL WHERE email = ?");
    $stmt_upd->bind_param('ss', $hash, $email);

    if ($stmt_upd->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Password berhasil diatur ulang! Silakan login dengan password baru Anda.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah password di database.']);
    }
    $stmt_upd->close();
} catch (Throwable $e) {
    echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()]);
}
$conn->close();
?>

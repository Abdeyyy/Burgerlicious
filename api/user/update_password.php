<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Silakan login terlebih dahulu.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$id_user     = $_SESSION['user_id'];
$oldPassword = $_POST['oldPassword'] ?? '';
$newPassword = $_POST['newPassword'] ?? '';
$confirm     = $_POST['confirmPassword'] ?? '';

if (!$oldPassword || !$newPassword || !$confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Semua kolom password harus diisi.']);
    exit;
}

if (strlen($newPassword) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password baru minimal 6 karakter.']);
    exit;
}

if ($newPassword !== $confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Konfirmasi password tidak cocok.']);
    exit;
}

try {
    // Ambil hash password lama di database
    $stmt = $conn->prepare("SELECT pass FROM user WHERE id_user = ?");
    $stmt->bind_param('i', $id_user);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$res) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pengguna tidak ditemukan.']);
        exit;
    }

    // Verifikasi password lama cocok
    if (!password_verify($oldPassword, $res['pass'])) {
        echo json_encode(['status' => 'error', 'message' => 'Password saat ini salah.']);
        exit;
    }

    // Buat hash password baru
    $new_hash = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password di database
    $stmt_upd = $conn->prepare("UPDATE user SET pass = ? WHERE id_user = ?");
    $stmt_upd->bind_param('si', $new_hash, $id_user);

    if ($stmt_upd->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Password berhasil diperbarui!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah password di database.']);
    }
    $stmt_upd->close();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()]);
}
$conn->close();
?>

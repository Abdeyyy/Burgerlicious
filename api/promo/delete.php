<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id_promo = $data['id_promo'] ?? '';

if (empty($id_promo)) {
    echo json_encode(['status' => 'error', 'message' => 'ID promo wajib diisi']);
    exit;
}

// Hapus gambar terkait jika ada
$check = $conn->prepare("SELECT gambar_url FROM promo WHERE id_promo = ?");
$check->bind_param("i", $id_promo);
$check->execute();
$result = $check->get_result()->fetch_assoc();
$check->close();

if ($result && !empty($result['gambar_url'])) {
    $img_path = __DIR__ . '/../../' . $result['gambar_url'];
    if (file_exists($img_path)) {
        unlink($img_path);
    }
}

$stmt = $conn->prepare("DELETE FROM promo WHERE id_promo = ?");
$stmt->bind_param("i", $id_promo);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Promo berhasil dihapus']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Promo tidak ditemukan']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus promo: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

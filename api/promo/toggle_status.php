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

// Toggle is_active: 1 -> 0, 0 -> 1
$stmt = $conn->prepare("UPDATE promo SET is_active = IF(is_active = 1, 0, 1) WHERE id_promo = ?");
$stmt->bind_param("i", $id_promo);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        // Ambil status baru
        $check = $conn->prepare("SELECT is_active FROM promo WHERE id_promo = ?");
        $check->bind_param("i", $id_promo);
        $check->execute();
        $result = $check->get_result()->fetch_assoc();
        $check->close();
        
        $status_text = $result['is_active'] == 1 ? 'diaktifkan' : 'dinonaktifkan';
        echo json_encode(['status' => 'success', 'message' => "Promo berhasil $status_text", 'is_active' => (int)$result['is_active']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Promo tidak ditemukan']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal toggle status: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

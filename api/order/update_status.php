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

$id_transaksi = $data['id_transaksi'] ?? null;
$status_baru = $data['status_pesanan'] ?? null;

$allowed_status = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

if (!$id_transaksi || !in_array($status_baru, $allowed_status)) {
    echo json_encode(['status' => 'error', 'message' => 'Input tidak valid']);
    exit;
}

$stmt = $conn->prepare("UPDATE transaksi SET status_pesanan = ? WHERE id_transaksi = ?");
$stmt->bind_param("si", $status_baru, $id_transaksi);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Status pesanan berhasil diperbarui']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui status']);
}

$stmt->close();
$conn->close();
?>

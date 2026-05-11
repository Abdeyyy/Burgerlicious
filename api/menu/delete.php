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
$id_menu = $data['id_menu'] ?? null;

if (!$id_menu) {
    echo json_encode(['status' => 'error', 'message' => 'ID Menu tidak valid']);
    exit;
}

// Ambil info gambar untuk dihapus dari storage
$stmt = $conn->prepare("SELECT gambar_url FROM menu WHERE id_menu = ?");
$stmt->bind_param("i", $id_menu);
$stmt->execute();
$result = $stmt->get_result();
$menu = $result->fetch_assoc();

if ($menu && $menu['gambar_url']) {
    $file_path = '../../' . $menu['gambar_url'];
    if (file_exists($file_path)) {
        unlink($file_path);
    }
}

$stmt = $conn->prepare("DELETE FROM menu WHERE id_menu = ?");
$stmt->bind_param("i", $id_menu);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Menu berhasil dihapus']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus menu']);
}

$stmt->close();
$conn->close();
?>

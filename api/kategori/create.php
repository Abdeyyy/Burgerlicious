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
$nama_kategori = $data['nama_kategori'] ?? '';

if (empty($nama_kategori)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama kategori tidak boleh kosong']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO kategori_menu (nama_kategori) VALUES (?)");
$stmt->bind_param("s", $nama_kategori);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Kategori berhasil ditambahkan']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menambahkan kategori']);
}

$stmt->close();
$conn->close();
?>

<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id_flash_sale = isset($input['id_flash_sale']) ? (int)$input['id_flash_sale'] : 0;

// Fallback to standard POST form data if JSON is not used
if ($id_flash_sale === 0) {
    $id_flash_sale = isset($_POST['id_flash_sale']) ? (int)$_POST['id_flash_sale'] : 0;
}

if ($id_flash_sale <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'ID Flash Sale tidak valid']);
    exit;
}

$stmt = $conn->prepare("DELETE FROM flash_sale WHERE id_flash_sale = ?");
$stmt->bind_param("i", $id_flash_sale);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Sesi Flash Sale berhasil dihapus']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus Flash Sale: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

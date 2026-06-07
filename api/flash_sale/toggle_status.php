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

if ($id_flash_sale === 0) {
    $id_flash_sale = isset($_POST['id_flash_sale']) ? (int)$_POST['id_flash_sale'] : 0;
}

if ($id_flash_sale <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'ID Flash Sale tidak valid']);
    exit;
}

// Get current status
$stmt = $conn->prepare("SELECT is_active FROM flash_sale WHERE id_flash_sale = ?");
$stmt->bind_param("i", $id_flash_sale);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$res) {
    echo json_encode(['status' => 'error', 'message' => 'Flash Sale tidak ditemukan']);
    exit;
}

$new_status = ($res['is_active'] == 1) ? 0 : 1;

$stmt_upd = $conn->prepare("UPDATE flash_sale SET is_active = ? WHERE id_flash_sale = ?");
$stmt_upd->bind_param("ii", $new_status, $id_flash_sale);

if ($stmt_upd->execute()) {
    $status_str = ($new_status == 1) ? 'diaktifkan' : 'dinonaktifkan';
    echo json_encode(['status' => 'success', 'message' => "Flash Sale berhasil $status_str", 'is_active' => $new_status]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah status: ' . $conn->error]);
}

$stmt_upd->close();
$conn->close();
?>

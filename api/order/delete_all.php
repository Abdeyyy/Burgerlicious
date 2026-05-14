<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Double-check confirmation token from frontend
$data = json_decode(file_get_contents('php://input'), true);
$confirm = $data['confirm'] ?? '';

if ($confirm !== 'DELETE_ALL_ANALYTICS') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Confirmation token invalid. Send {"confirm": "DELETE_ALL_ANALYTICS"}']);
    exit;
}

$conn->begin_transaction();

try {
    // Count before deletion for reporting
    $count_result = $conn->query("SELECT COUNT(*) as total FROM transaksi");
    $total_deleted = $count_result->fetch_assoc()['total'];

    // 1. Delete detail_transaksi first (FK constraint)
    $conn->query("DELETE FROM detail_transaksi");
    
    // 2. Delete all transaksi
    $conn->query("DELETE FROM transaksi");

    // 3. Reset AUTO_INCREMENT
    $conn->query("ALTER TABLE detail_transaksi AUTO_INCREMENT = 1");
    $conn->query("ALTER TABLE transaksi AUTO_INCREMENT = 1");

    $conn->commit();

    echo json_encode([
        'status' => 'success',
        'message' => "Semua data transaksi berhasil dihapus ($total_deleted transaksi).",
        'deleted_count' => (int)$total_deleted
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus data: ' . $e->getMessage()]);
}

$conn->close();
?>

<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$status = $_GET['status'] ?? null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

$query = "SELECT t.* FROM transaksi t";
$params = [];
$types = "";

if ($status) {
    $query .= " WHERE t.status_pesanan = ?";
    $params[] = $status;
    $types .= "s";
}
$query .= " ORDER BY t.tanggal_transaksi DESC LIMIT ?";
$params[] = $limit;
$types .= "i";

$stmt = $conn->prepare($query);
$stmt->bind_param($types, ...$params);

$stmt->execute();
$result = $stmt->get_result();
$orders = [];

while ($row = $result->fetch_assoc()) {
    $id_transaksi = $row['id_transaksi'];
    
    // Get details for each order
    $detail_query = "SELECT dt.*, m.nama_menu, m.gambar_url 
                     FROM detail_transaksi dt 
                     JOIN menu m ON dt.id_menu = m.id_menu 
                     WHERE dt.id_transaksi = ?";
    $detail_stmt = $conn->prepare($detail_query);
    $detail_stmt->bind_param("i", $id_transaksi);
    $detail_stmt->execute();
    $detail_result = $detail_stmt->get_result();
    
    $items = [];
    while ($detail_row = $detail_result->fetch_assoc()) {
        $items[] = $detail_row;
    }
    
    $row['items'] = $items;
    $orders[] = $row;
    $detail_stmt->close();
}

echo json_encode(['status' => 'success', 'data' => $orders]);

$stmt->close();
$conn->close();
?>

<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

// No auth check for public monitor

$stmt = $conn->prepare("SELECT id_transaksi FROM transaksi WHERE status_pesanan = 'preparing' ORDER BY tanggal_transaksi ASC LIMIT 15");
$stmt->execute();
$res = $stmt->get_result();
$preparing = [];
while ($row = $res->fetch_assoc()) $preparing[] = $row['id_transaksi'];

$stmt = $conn->prepare("SELECT id_transaksi FROM transaksi WHERE status_pesanan = 'ready' ORDER BY tanggal_transaksi DESC LIMIT 15");
$stmt->execute();
$res = $stmt->get_result();
$ready = [];
while ($row = $res->fetch_assoc()) $ready[] = $row['id_transaksi'];

echo json_encode([
    'status' => 'success',
    'data' => [
        'preparing' => $preparing,
        'ready' => $ready
    ]
]);

$conn->close();
?>

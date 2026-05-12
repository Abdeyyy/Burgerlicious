<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$notifications = [];

// 1. Fetch New Pending Orders (Last 24 hours)
$order_query = "SELECT id_transaksi, nama_pelanggan, tanggal_transaksi 
                FROM transaksi 
                WHERE status_pesanan = 'pending' 
                AND tanggal_transaksi >= NOW() - INTERVAL 1 DAY 
                ORDER BY tanggal_transaksi DESC";
$order_result = $conn->query($order_query);

if ($order_result) {
    while ($row = $order_result->fetch_assoc()) {
        $notifications[] = [
            'type' => 'new_order',
            'title' => 'Pesanan Baru!',
            'message' => 'Pesanan #' . $row['id_transaksi'] . ' dari ' . $row['nama_pelanggan'],
            'time' => $row['tanggal_transaksi'],
            'link' => 'order_queue.html'
        ];
    }
}

// 2. Fetch Out of Stock Items
$stock_query = "SELECT id_menu, nama_menu FROM menu WHERE status_tersedia = 0";
$stock_result = $conn->query($stock_query);

if ($stock_result) {
    while ($row = $stock_result->fetch_assoc()) {
        $notifications[] = [
            'type' => 'stock_alert',
            'title' => 'Stok Habis!',
            'message' => 'Menu "' . $row['nama_menu'] . '" sudah tidak tersedia.',
            'time' => date('Y-m-d H:i:s'), // Current time since it's an active status
            'link' => 'menu_management.html'
        ];
    }
}

// Sort all notifications by time DESC
usort($notifications, function($a, $b) {
    return strtotime($b['time']) - strtotime($a['time']);
});

echo json_encode(['status' => 'success', 'data' => $notifications]);

$conn->close();
?>

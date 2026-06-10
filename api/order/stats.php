<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$today = date('Y-m-d');

// Total Orders Today
$stmt = $conn->prepare("SELECT COUNT(*) as total FROM transaksi WHERE DATE(tanggal_transaksi) = ? AND status_pesanan != 'cancelled'");
$stmt->bind_param("s", $today);
$stmt->execute();
$total_today = $stmt->get_result()->fetch_assoc()['total'] ?? 0;

// Revenue Today
$stmt = $conn->prepare("SELECT SUM(total_harga) as revenue FROM transaksi WHERE DATE(tanggal_transaksi) = ? AND status_pesanan = 'completed'");
$stmt->bind_param("s", $today);
$stmt->execute();
$revenue_today = $stmt->get_result()->fetch_assoc()['revenue'] ?? 0;

// Pending Count
$stmt = $conn->prepare("SELECT COUNT(*) as total FROM transaksi WHERE status_pesanan = 'pending'");
$stmt->execute();
$pending = $stmt->get_result()->fetch_assoc()['total'] ?? 0;

// Active Queue (Preparing)
$stmt = $conn->prepare("SELECT COUNT(*) as total FROM transaksi WHERE status_pesanan = 'preparing'");
$stmt->execute();
$preparing = $stmt->get_result()->fetch_assoc()['total'] ?? 0;

// Trending Item (Top Sold Menu Item, excluding cancelled transactions)
$trending_query = "
    SELECT m.nama_menu, SUM(dt.jumlah) as total_sold
    FROM detail_transaksi dt
    JOIN menu m ON dt.id_menu = m.id_menu
    JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
    WHERE t.status_pesanan != 'cancelled'
    GROUP BY dt.id_menu
    ORDER BY total_sold DESC
    LIMIT 1
";
$trending_res = $conn->query($trending_query);
$trending = $trending_res ? $trending_res->fetch_assoc() : null;
$trending_name = $trending ? $trending['nama_menu'] : '-';
$trending_sales = $trending ? (int)$trending['total_sold'] : 0;

echo json_encode([
    'status' => 'success',
    'data' => [
        'total_orders' => $total_today,
        'revenue' => (float)($revenue_today ?? 0),
        'pending' => $pending,
        'preparing' => $preparing,
        'trending_item' => $trending_name,
        'trending_sales' => $trending_sales
    ]
]);

$conn->close();
?>


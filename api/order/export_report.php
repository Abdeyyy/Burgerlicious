<?php
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

// === Parameters ===
$range = isset($_GET['range']) ? (int)$_GET['range'] : 7;
$kategori = isset($_GET['kategori']) ? (int)$_GET['kategori'] : null;
$tipe = isset($_GET['tipe']) ? $_GET['tipe'] : null;

$allowed_ranges = [7, 30, 90, 365];
if (!in_array($range, $allowed_ranges)) {
    $range = 7;
}

if ($tipe && !in_array($tipe, ['dine-in', 'takeaway'])) {
    $tipe = null;
}

$end_date = date('Y-m-d H:i:s');
$start_date = date('Y-m-d 00:00:00', strtotime("-{$range} days"));

// === Set CSV Headers ===
$filename = 'burgerlicious_report_' . date('Y-m-d') . '_' . $range . 'days.csv';
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$output = fopen('php://output', 'w');

// BOM for Excel UTF-8 compatibility
fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

// === Section 1: Report Header ===
fputcsv($output, ['BURGERLICIOUS - ANALYTICS REPORT']);
fputcsv($output, ['Generated', date('Y-m-d H:i:s')]);
fputcsv($output, ['Period', "$range days ($start_date to $end_date)"]);
if ($tipe) fputcsv($output, ['Filter - Order Type', $tipe]);
if ($kategori) {
    $stmt = $conn->prepare("SELECT nama_kategori FROM kategori_menu WHERE id_kategori = ?");
    $stmt->bind_param("i", $kategori);
    $stmt->execute();
    $kat_name = $stmt->get_result()->fetch_assoc()['nama_kategori'] ?? 'Unknown';
    $stmt->close();
    fputcsv($output, ['Filter - Category', $kat_name]);
}
fputcsv($output, []); // blank line

// === Section 2: KPI Summary ===
// Build WHERE
$conditions = ["t.tanggal_transaksi >= ?", "t.tanggal_transaksi <= ?", "t.status_pesanan = 'completed'"];
$params = [$start_date, $end_date];
$types = "ss";

if ($tipe) {
    $conditions[] = "t.tipe_pesanan = ?";
    $params[] = $tipe;
    $types .= "s";
}

$where = implode(' AND ', $conditions);

$kpi_query = "SELECT 
    COALESCE(SUM(t.total_harga), 0) as total_revenue,
    COUNT(*) as total_orders,
    COUNT(DISTINCT CASE WHEN t.id_user IS NOT NULL THEN t.id_user ELSE CONCAT('guest_', t.nama_pelanggan) END) as unique_customers,
    COALESCE(AVG(t.total_harga), 0) as avg_order_value
FROM transaksi t WHERE $where";

$stmt = $conn->prepare($kpi_query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$kpi = $stmt->get_result()->fetch_assoc();
$stmt->close();

fputcsv($output, ['=== KPI SUMMARY ===']);
fputcsv($output, ['Metric', 'Value']);
fputcsv($output, ['Total Revenue', 'Rp ' . number_format($kpi['total_revenue'], 0, ',', '.')]);
fputcsv($output, ['Total Orders', $kpi['total_orders']]);
fputcsv($output, ['Unique Customers', $kpi['unique_customers']]);
fputcsv($output, ['Avg Order Value', 'Rp ' . number_format($kpi['avg_order_value'], 0, ',', '.')]);
fputcsv($output, []);

// === Section 3: Daily Revenue ===
$daily_query = "SELECT 
    DATE(t.tanggal_transaksi) as tanggal,
    COUNT(*) as jumlah_order,
    SUM(t.total_harga) as revenue
FROM transaksi t
WHERE $where
GROUP BY DATE(t.tanggal_transaksi)
ORDER BY DATE(t.tanggal_transaksi) ASC";

$stmt = $conn->prepare($daily_query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

fputcsv($output, ['=== DAILY REVENUE ===']);
fputcsv($output, ['Date', 'Orders', 'Revenue']);
while ($row = $result->fetch_assoc()) {
    fputcsv($output, [
        $row['tanggal'],
        $row['jumlah_order'],
        'Rp ' . number_format($row['revenue'], 0, ',', '.')
    ]);
}
$stmt->close();
fputcsv($output, []);

// === Section 4: Sales by Category ===
$cat_query = "SELECT 
    km.nama_kategori,
    COALESCE(SUM(dt.jumlah), 0) as items_sold,
    COALESCE(SUM(dt.subtotal), 0) as revenue
FROM kategori_menu km
LEFT JOIN menu m ON m.id_kategori = km.id_kategori
LEFT JOIN detail_transaksi dt ON dt.id_menu = m.id_menu
LEFT JOIN transaksi t ON t.id_transaksi = dt.id_transaksi AND $where
GROUP BY km.id_kategori, km.nama_kategori
ORDER BY revenue DESC";

$stmt = $conn->prepare($cat_query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

fputcsv($output, ['=== SALES BY CATEGORY ===']);
fputcsv($output, ['Category', 'Items Sold', 'Revenue']);
while ($row = $result->fetch_assoc()) {
    fputcsv($output, [
        $row['nama_kategori'],
        $row['items_sold'],
        'Rp ' . number_format($row['revenue'], 0, ',', '.')
    ]);
}
$stmt->close();
fputcsv($output, []);

// === Section 5: Top Items ===
$top_query = "SELECT 
    m.nama_menu,
    km.nama_kategori,
    SUM(dt.jumlah) as total_sold,
    SUM(dt.subtotal) as total_revenue
FROM detail_transaksi dt
JOIN menu m ON dt.id_menu = m.id_menu
JOIN kategori_menu km ON m.id_kategori = km.id_kategori
JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
WHERE $where
GROUP BY m.id_menu, m.nama_menu, km.nama_kategori
ORDER BY total_sold DESC
LIMIT 10";

$stmt = $conn->prepare($top_query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

fputcsv($output, ['=== TOP SELLING ITEMS ===']);
fputcsv($output, ['Rank', 'Item Name', 'Category', 'Qty Sold', 'Revenue']);
$rank = 1;
while ($row = $result->fetch_assoc()) {
    fputcsv($output, [
        $rank++,
        $row['nama_menu'],
        $row['nama_kategori'],
        $row['total_sold'],
        'Rp ' . number_format($row['total_revenue'], 0, ',', '.')
    ]);
}
$stmt->close();
fputcsv($output, []);

// === Section 6: Transaction Detail ===
$detail_query = "SELECT 
    t.id_transaksi,
    t.nama_pelanggan,
    CASE WHEN t.id_user IS NULL THEN 'Guest' ELSE 'Registered' END as customer_type,
    t.tipe_pesanan,
    t.status_pesanan,
    t.total_harga,
    t.tanggal_transaksi
FROM transaksi t
WHERE $where
ORDER BY t.tanggal_transaksi DESC";

$stmt = $conn->prepare($detail_query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

fputcsv($output, ['=== TRANSACTION DETAILS ===']);
fputcsv($output, ['ID', 'Customer', 'Type', 'Order Type', 'Status', 'Total', 'Date']);
while ($row = $result->fetch_assoc()) {
    fputcsv($output, [
        $row['id_transaksi'],
        $row['nama_pelanggan'],
        $row['customer_type'],
        $row['tipe_pesanan'],
        $row['status_pesanan'],
        'Rp ' . number_format($row['total_harga'], 0, ',', '.'),
        $row['tanggal_transaksi']
    ]);
}
$stmt->close();

fclose($output);
$conn->close();
?>

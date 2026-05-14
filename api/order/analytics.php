<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

// === Parameters ===
$range = isset($_GET['range']) ? (int)$_GET['range'] : 7; // days
$kategori = isset($_GET['kategori']) ? (int)$_GET['kategori'] : null;
$tipe = isset($_GET['tipe']) ? $_GET['tipe'] : null; // dine-in | takeaway

// Validate range
$allowed_ranges = [7, 30, 90, 365];
if (!in_array($range, $allowed_ranges)) {
    $range = 7;
}

// Validate tipe
if ($tipe && !in_array($tipe, ['dine-in', 'takeaway'])) {
    $tipe = null;
}

// === Date Boundaries ===
$end_date = date('Y-m-d H:i:s');
$start_date = date('Y-m-d 00:00:00', strtotime("-{$range} days"));
$prev_start_date = date('Y-m-d 00:00:00', strtotime("-" . ($range * 2) . " days"));
$prev_end_date = $start_date;

// === Helper: Build WHERE clause ===
function buildWhereClause($start, $end, $tipe, $kategori, $require_completed = true) {
    $conditions = ["t.tanggal_transaksi >= ?", "t.tanggal_transaksi <= ?"];
    $params = [$start, $end];
    $types = "ss";
    
    if ($require_completed) {
        $conditions[] = "t.status_pesanan = 'completed'";
    } else {
        $conditions[] = "t.status_pesanan != 'cancelled'";
    }
    
    if ($tipe) {
        $conditions[] = "t.tipe_pesanan = ?";
        $params[] = $tipe;
        $types .= "s";
    }
    
    if ($kategori) {
        // Kategori filter requires join with detail_transaksi + menu
        $conditions[] = "EXISTS (SELECT 1 FROM detail_transaksi dt2 JOIN menu m2 ON dt2.id_menu = m2.id_menu WHERE dt2.id_transaksi = t.id_transaksi AND m2.id_kategori = ?)";
        $params[] = $kategori;
        $types .= "i";
    }
    
    return [
        'where' => implode(' AND ', $conditions),
        'params' => $params,
        'types' => $types
    ];
}

// === 1. KPI Metrics (Current Period) ===
$w = buildWhereClause($start_date, $end_date, $tipe, $kategori);
$kpi_query = "SELECT 
    COALESCE(SUM(t.total_harga), 0) as total_revenue,
    COUNT(*) as total_orders,
    COUNT(DISTINCT CASE WHEN t.id_user IS NOT NULL THEN t.id_user ELSE CONCAT('guest_', t.nama_pelanggan) END) as unique_customers,
    COALESCE(AVG(t.total_harga), 0) as avg_order_value
FROM transaksi t WHERE {$w['where']}";

$stmt = $conn->prepare($kpi_query);
if (!empty($w['params'])) {
    $stmt->bind_param($w['types'], ...$w['params']);
}
$stmt->execute();
$kpi = $stmt->get_result()->fetch_assoc();
$stmt->close();

// === 2. KPI Metrics (Previous Period - for change %) ===
$wp = buildWhereClause($prev_start_date, $prev_end_date, $tipe, $kategori);
$prev_query = "SELECT 
    COALESCE(SUM(t.total_harga), 0) as total_revenue,
    COUNT(*) as total_orders,
    COUNT(DISTINCT CASE WHEN t.id_user IS NOT NULL THEN t.id_user ELSE CONCAT('guest_', t.nama_pelanggan) END) as unique_customers,
    COALESCE(AVG(t.total_harga), 0) as avg_order_value
FROM transaksi t WHERE {$wp['where']}";

$stmt = $conn->prepare($prev_query);
if (!empty($wp['params'])) {
    $stmt->bind_param($wp['types'], ...$wp['params']);
}
$stmt->execute();
$prev_kpi = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Calculate change percentages
function calcChange($current, $previous) {
    if ($previous == 0) {
        return $current > 0 ? '+100%' : '0%';
    }
    $change = (($current - $previous) / $previous) * 100;
    $sign = $change >= 0 ? '+' : '';
    return $sign . number_format($change, 1) . '%';
}

// New customers (id_user registered within the range period)
$new_cust_query = "SELECT COUNT(DISTINCT t.id_user) as new_customers 
FROM transaksi t 
WHERE t.tanggal_transaksi >= ? AND t.tanggal_transaksi <= ? 
AND t.status_pesanan = 'completed'
AND t.id_user IS NOT NULL
AND t.id_user NOT IN (
    SELECT DISTINCT t2.id_user FROM transaksi t2 
    WHERE t2.tanggal_transaksi < ? 
    AND t2.id_user IS NOT NULL
    AND t2.status_pesanan = 'completed'
)";
$stmt = $conn->prepare($new_cust_query);
$stmt->bind_param("sss", $start_date, $end_date, $start_date);
$stmt->execute();
$new_customers = $stmt->get_result()->fetch_assoc()['new_customers'] ?? 0;
$stmt->close();

// === 3. Revenue Trend (per day) ===
$w_trend = buildWhereClause($start_date, $end_date, $tipe, $kategori);
$trend_query = "SELECT 
    DATE(t.tanggal_transaksi) as date_label,
    COALESCE(SUM(t.total_harga), 0) as value,
    COUNT(*) as order_count
FROM transaksi t 
WHERE {$w_trend['where']}
GROUP BY DATE(t.tanggal_transaksi)
ORDER BY DATE(t.tanggal_transaksi) ASC";

$stmt = $conn->prepare($trend_query);
if (!empty($w_trend['params'])) {
    $stmt->bind_param($w_trend['types'], ...$w_trend['params']);
}
$stmt->execute();
$result = $stmt->get_result();
$revenue_trend = [];
while ($row = $result->fetch_assoc()) {
    $revenue_trend[] = [
        'label' => $row['date_label'],
        'value' => (float)$row['value'],
        'order_count' => (int)$row['order_count']
    ];
}
$stmt->close();

// === 4. Category Breakdown ===
$w_cat = buildWhereClause($start_date, $end_date, $tipe, null); // no kategori filter here
$cat_query = "SELECT 
    km.id_kategori,
    km.nama_kategori,
    COALESCE(SUM(dt.jumlah), 0) as total_sales,
    COALESCE(SUM(dt.subtotal), 0) as total_revenue
FROM kategori_menu km
LEFT JOIN menu m ON m.id_kategori = km.id_kategori
LEFT JOIN detail_transaksi dt ON dt.id_menu = m.id_menu
LEFT JOIN transaksi t ON t.id_transaksi = dt.id_transaksi AND {$w_cat['where']}
GROUP BY km.id_kategori, km.nama_kategori
ORDER BY total_revenue DESC";

$stmt = $conn->prepare($cat_query);
if (!empty($w_cat['params'])) {
    $stmt->bind_param($w_cat['types'], ...$w_cat['params']);
}
$stmt->execute();
$result = $stmt->get_result();
$category_breakdown = [];
$total_cat_revenue = 0;
while ($row = $result->fetch_assoc()) {
    $total_cat_revenue += (float)$row['total_revenue'];
    $category_breakdown[] = $row;
}
// Add percentage
foreach ($category_breakdown as &$cat) {
    $cat['total_sales'] = (int)$cat['total_sales'];
    $cat['total_revenue'] = (float)$cat['total_revenue'];
    $cat['percentage'] = $total_cat_revenue > 0 ? round(($cat['total_revenue'] / $total_cat_revenue) * 100, 1) : 0;
}
unset($cat);
$stmt->close();

// === 5. Top Selling Items (Top 5) ===
$w_top = buildWhereClause($start_date, $end_date, $tipe, $kategori);
$top_query = "SELECT 
    m.id_menu,
    m.nama_menu,
    m.gambar_url,
    km.nama_kategori,
    COALESCE(SUM(dt.jumlah), 0) as total_sold,
    COALESCE(SUM(dt.subtotal), 0) as total_revenue
FROM detail_transaksi dt
JOIN menu m ON dt.id_menu = m.id_menu
JOIN kategori_menu km ON m.id_kategori = km.id_kategori
JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
WHERE {$w_top['where']}
GROUP BY m.id_menu, m.nama_menu, m.gambar_url, km.nama_kategori
ORDER BY total_sold DESC
LIMIT 5";

$stmt = $conn->prepare($top_query);
if (!empty($w_top['params'])) {
    $stmt->bind_param($w_top['types'], ...$w_top['params']);
}
$stmt->execute();
$result = $stmt->get_result();
$top_items = [];
while ($row = $result->fetch_assoc()) {
    $top_items[] = [
        'id_menu' => (int)$row['id_menu'],
        'nama_menu' => $row['nama_menu'],
        'gambar_url' => $row['gambar_url'],
        'nama_kategori' => $row['nama_kategori'],
        'total_sold' => (int)$row['total_sold'],
        'total_revenue' => (float)$row['total_revenue']
    ];
}
$stmt->close();

// === 6. Customer Insights ===
$w_ins = buildWhereClause($start_date, $end_date, $tipe, $kategori);

// 6a. Repeat rate (customers with more than 1 completed order)
$repeat_query = "SELECT 
    COUNT(*) as total_customers,
    SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END) as repeat_customers
FROM (
    SELECT 
        CASE WHEN t.id_user IS NOT NULL THEN CAST(t.id_user AS CHAR) ELSE CONCAT('guest_', t.nama_pelanggan) END as customer_id,
        COUNT(*) as order_count
    FROM transaksi t
    WHERE {$w_ins['where']}
    GROUP BY customer_id
) sub";

$stmt = $conn->prepare($repeat_query);
if (!empty($w_ins['params'])) {
    $stmt->bind_param($w_ins['types'], ...$w_ins['params']);
}
$stmt->execute();
$repeat_data = $stmt->get_result()->fetch_assoc();
$total_cust = (int)($repeat_data['total_customers'] ?? 0);
$repeat_cust = (int)($repeat_data['repeat_customers'] ?? 0);
$repeat_rate = $total_cust > 0 ? round(($repeat_cust / $total_cust) * 100, 1) : 0;
$stmt->close();

// 6b. Average items per order
$avg_items_query = "SELECT 
    COALESCE(AVG(item_count), 0) as avg_items
FROM (
    SELECT dt.id_transaksi, SUM(dt.jumlah) as item_count
    FROM detail_transaksi dt
    JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
    WHERE {$w_ins['where']}
    GROUP BY dt.id_transaksi
) sub";

$stmt = $conn->prepare($avg_items_query);
if (!empty($w_ins['params'])) {
    $stmt->bind_param($w_ins['types'], ...$w_ins['params']);
}
$stmt->execute();
$avg_items = round((float)($stmt->get_result()->fetch_assoc()['avg_items'] ?? 0), 1);
$stmt->close();

// 6c. Peak hour
$peak_query = "SELECT 
    HOUR(t.tanggal_transaksi) as peak_hour,
    COUNT(*) as order_count
FROM transaksi t
WHERE {$w_ins['where']}
GROUP BY HOUR(t.tanggal_transaksi)
ORDER BY order_count DESC
LIMIT 1";

$stmt = $conn->prepare($peak_query);
if (!empty($w_ins['params'])) {
    $stmt->bind_param($w_ins['types'], ...$w_ins['params']);
}
$stmt->execute();
$peak_result = $stmt->get_result()->fetch_assoc();
$peak_hour = $peak_result ? sprintf('%02d:00', $peak_result['peak_hour']) : '-';
$stmt->close();

// 6d. Dine-in vs Takeaway ratio
$ratio_query = "SELECT 
    SUM(CASE WHEN t.tipe_pesanan = 'dine-in' THEN 1 ELSE 0 END) as dine_in,
    SUM(CASE WHEN t.tipe_pesanan = 'takeaway' THEN 1 ELSE 0 END) as takeaway,
    COUNT(*) as total
FROM transaksi t
WHERE {$w_ins['where']}";

$stmt = $conn->prepare($ratio_query);
if (!empty($w_ins['params'])) {
    $stmt->bind_param($w_ins['types'], ...$w_ins['params']);
}
$stmt->execute();
$ratio_data = $stmt->get_result()->fetch_assoc();
$total_ratio = (int)($ratio_data['total'] ?? 0);
$dine_in_ratio = $total_ratio > 0 ? round(((int)$ratio_data['dine_in'] / $total_ratio) * 100, 1) : 0;
$takeaway_ratio = $total_ratio > 0 ? round(((int)$ratio_data['takeaway'] / $total_ratio) * 100, 1) : 0;
$stmt->close();

// 6e. Guest vs Registered ratio
$guest_query = "SELECT 
    SUM(CASE WHEN t.id_user IS NULL THEN 1 ELSE 0 END) as guest_orders,
    SUM(CASE WHEN t.id_user IS NOT NULL THEN 1 ELSE 0 END) as registered_orders,
    COUNT(*) as total
FROM transaksi t
WHERE {$w_ins['where']}";

$stmt = $conn->prepare($guest_query);
if (!empty($w_ins['params'])) {
    $stmt->bind_param($w_ins['types'], ...$w_ins['params']);
}
$stmt->execute();
$guest_data = $stmt->get_result()->fetch_assoc();
$total_guest = (int)($guest_data['total'] ?? 0);
$guest_pct = $total_guest > 0 ? round(((int)$guest_data['guest_orders'] / $total_guest) * 100, 1) : 0;
$registered_pct = $total_guest > 0 ? round(((int)$guest_data['registered_orders'] / $total_guest) * 100, 1) : 0;
$stmt->close();

// === Build Response ===
echo json_encode([
    'status' => 'success',
    'data' => [
        'kpi' => [
            'total_revenue' => (float)$kpi['total_revenue'],
            'total_orders' => (int)$kpi['total_orders'],
            'unique_customers' => (int)$kpi['unique_customers'],
            'new_customers' => (int)$new_customers,
            'avg_order_value' => round((float)$kpi['avg_order_value'], 2),
            'revenue_change' => calcChange($kpi['total_revenue'], $prev_kpi['total_revenue']),
            'orders_change' => calcChange($kpi['total_orders'], $prev_kpi['total_orders']),
            'customers_change' => calcChange($kpi['unique_customers'], $prev_kpi['unique_customers']),
            'aov_change' => calcChange($kpi['avg_order_value'], $prev_kpi['avg_order_value'])
        ],
        'revenue_trend' => $revenue_trend,
        'category_breakdown' => $category_breakdown,
        'top_items' => $top_items,
        'customer_insights' => [
            'repeat_rate' => $repeat_rate,
            'avg_items_per_order' => $avg_items,
            'peak_hour' => $peak_hour,
            'dine_in_ratio' => $dine_in_ratio,
            'takeaway_ratio' => $takeaway_ratio,
            'guest_percentage' => $guest_pct,
            'registered_percentage' => $registered_pct
        ]
    ],
    'meta' => [
        'range_days' => $range,
        'start_date' => $start_date,
        'end_date' => $end_date,
        'filters' => [
            'kategori' => $kategori,
            'tipe' => $tipe
        ]
    ]
]);

$conn->close();
?>

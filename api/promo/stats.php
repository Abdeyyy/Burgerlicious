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

// 1. Total Active Promos
$q_active = $conn->query("SELECT COUNT(*) as total FROM promo WHERE is_active = 1 AND tanggal_mulai <= '$today' AND tanggal_selesai >= '$today'");
$r_active = $q_active->fetch_assoc();
$total_active = $r_active['total'] ?? 0;

// 2. Total Redemptions
$q_redemptions = $conn->query("SELECT COUNT(*) as total, SUM(nilai_potongan) as total_potongan FROM promo_usage");
$r_redemptions = $q_redemptions->fetch_assoc();
$total_redemptions = $r_redemptions['total'] ?? 0;
$total_discount_value = $r_redemptions['total_potongan'] ?? 0;

// 3. Revenue generated from orders with promo (total_harga where id_promo is not null)
$q_rev_promo = $conn->query("SELECT SUM(total_harga) as total FROM transaksi WHERE id_promo IS NOT NULL AND status_pesanan = 'completed'");
$r_rev_promo = $q_rev_promo->fetch_assoc();
$revenue_from_promos = $r_rev_promo['total'] ?? 0;

// 4. Monthly redemptions target percentage (mock dynamic performance relative to 1000 targets)
$monthly_target = 1000;
$current_month_redemptions = 0;
$start_month = date('Y-m-01 00:00:00');
$end_month = date('Y-m-t 23:59:59');

$q_month_redemptions = $conn->query("SELECT COUNT(*) as total FROM promo_usage WHERE tanggal_digunakan BETWEEN '$start_month' AND '$end_month'");
$r_month_redemptions = $q_month_redemptions->fetch_assoc();
$current_month_redemptions = $r_month_redemptions['total'] ?? 0;
$target_percentage = $monthly_target > 0 ? round(($current_month_redemptions / $monthly_target) * 100) : 0;
if ($target_percentage > 100) $target_percentage = 100;

// 5. Active Customers using promos (count unique users that used promos, if none fallback to unique guest order count)
$q_users = $conn->query("SELECT COUNT(DISTINCT IFNULL(id_user, nama_pelanggan)) as total FROM transaksi WHERE id_promo IS NOT NULL");
$r_users = $q_users->fetch_assoc();
$active_promo_users = $r_users['total'] ?? 0;

echo json_encode([
    'status' => 'success',
    'data' => [
        'total_active_promos' => (int)$total_active,
        'total_redemptions' => (int)$total_redemptions,
        'revenue_from_promos' => (float)$revenue_from_promos,
        'total_discount_given' => (float)$total_discount_value,
        'target_percentage' => $target_percentage,
        'monthly_redemptions' => (int)$current_month_redemptions,
        'active_promo_users' => (int)$active_promo_users
    ]
]);

$conn->close();
?>

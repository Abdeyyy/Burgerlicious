<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$status_filter = $_GET['status'] ?? 'all';

$sql = "SELECT p.*, km.nama_kategori, m.nama_menu AS nama_menu_target 
        FROM promo p 
        LEFT JOIN kategori_menu km ON p.id_kategori_target = km.id_kategori
        LEFT JOIN menu m ON p.id_menu_target = m.id_menu";

$conditions = [];
$today = date('Y-m-d');

switch ($status_filter) {
    case 'active':
        $conditions[] = "p.is_active = 1 AND p.tanggal_mulai <= '$today' AND p.tanggal_selesai >= '$today'";
        break;
    case 'scheduled':
        $conditions[] = "p.is_active = 1 AND p.tanggal_mulai > '$today'";
        break;
    case 'expired':
        $conditions[] = "p.tanggal_selesai < '$today'";
        break;
    case 'inactive':
        $conditions[] = "p.is_active = 0";
        break;
}

if (!empty($conditions)) {
    $sql .= " WHERE " . implode(' AND ', $conditions);
}

$sql .= " ORDER BY p.created_at DESC";

$result = $conn->query($sql);

if ($result) {
    $promos = [];
    while ($row = $result->fetch_assoc()) {
        // Hitung status dinamis
        if ($row['is_active'] == 0) {
            $row['computed_status'] = 'inactive';
        } else if ($row['tanggal_mulai'] > $today) {
            $row['computed_status'] = 'scheduled';
        } else if ($row['tanggal_selesai'] < $today) {
            $row['computed_status'] = 'expired';
        } else if ($row['max_usage'] !== null && $row['current_usage'] >= $row['max_usage']) {
            $row['computed_status'] = 'maxed';
        } else {
            $row['computed_status'] = 'active';
        }

        // Fetch bundling items if type is bundling
        $row['bundling_items'] = [];
        if ($row['tipe_promo'] === 'bundling') {
            $id_promo_item = $row['id_promo'];
            $items_res = $conn->query("SELECT bi.*, m.nama_menu, km.nama_kategori 
                                       FROM promo_bundling_items bi 
                                       LEFT JOIN menu m ON bi.id_menu = m.id_menu 
                                       LEFT JOIN kategori_menu km ON bi.id_kategori = km.id_kategori 
                                       WHERE bi.id_promo = $id_promo_item");
            if ($items_res) {
                while ($item_row = $items_res->fetch_assoc()) {
                    $row['bundling_items'][] = $item_row;
                }
            }
        }

        $promos[] = $row;
    }
    echo json_encode(['status' => 'success', 'data' => $promos]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data promo: ' . $conn->error]);
}

$conn->close();
?>

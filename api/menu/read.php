<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
require_once '../../config/db.php';

$sql = "SELECT m.*, k.nama_kategori,
               fs_active.harga_promo AS fs_harga_promo,
               fs_active.stok_promo AS fs_stok_promo,
               fs_active.stok_terjual AS fs_stok_terjual,
               fs_active.waktu_selesai AS fs_waktu_selesai,
               fs_active.id_flash_sale AS fs_id
        FROM menu m 
        JOIN kategori_menu k ON m.id_kategori = k.id_kategori 
        LEFT JOIN (
            SELECT fsi.id_menu, fsi.harga_promo, fsi.stok_promo, fsi.stok_terjual, fs.waktu_selesai, fs.id_flash_sale
            FROM flash_sale_items fsi
            JOIN flash_sale fs ON fsi.id_flash_sale = fs.id_flash_sale
            WHERE fs.is_active = 1 AND NOW() BETWEEN fs.waktu_mulai AND fs.waktu_selesai
        ) fs_active ON m.id_menu = fs_active.id_menu
        ORDER BY m.id_menu DESC";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => 'Query error: ' . $conn->error]);
    $conn->close();
    exit;
}

$menu = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        if ($row['fs_id'] !== null) {
            $row['flash_sale'] = [
                'id_flash_sale' => (int)$row['fs_id'],
                'harga_promo' => (float)$row['fs_harga_promo'],
                'stok_promo' => (int)$row['fs_stok_promo'],
                'stok_terjual' => (int)$row['fs_stok_terjual'],
                'waktu_selesai' => $row['fs_waktu_selesai']
            ];
        } else {
            $row['flash_sale'] = null;
        }
        
        // Remove flat temporary fields
        unset($row['fs_harga_promo'], $row['fs_stok_promo'], $row['fs_stok_terjual'], $row['fs_waktu_selesai'], $row['fs_id']);
        
        $menu[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $menu]);
$conn->close();
?>

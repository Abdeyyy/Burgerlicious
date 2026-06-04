<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

$today = date('Y-m-d');

$sql = "SELECT p.id_promo, p.nama_promo, p.deskripsi, p.tipe_promo, p.nilai_diskon, 
               p.kode_promo, p.min_order, p.gambar_url, p.tanggal_mulai, p.tanggal_selesai,
               p.hari_aktif, p.id_kategori_target, km.nama_kategori
        FROM promo p
        LEFT JOIN kategori_menu km ON p.id_kategori_target = km.id_kategori
        WHERE p.is_active = 1 
          AND p.tanggal_mulai <= ? 
          AND p.tanggal_selesai >= ?
          AND (p.max_usage IS NULL OR p.current_usage < p.max_usage)
        ORDER BY p.tanggal_selesai ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $today, $today);
$stmt->execute();
$result = $stmt->get_result();

$promos = [];
while ($row = $result->fetch_assoc()) {
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

$stmt->close();
$conn->close();
?>

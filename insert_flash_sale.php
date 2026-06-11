<?php
header('Content-Type: text/plain');
require_once 'config/db.php';

// Matikan flash sale lama yang bertabrakan jika ada
$conn->query("UPDATE flash_sale SET is_active = 0");

$nama = 'Flash Sale Spesial Presentasi';
$start = date('Y-m-d H:i:s', strtotime('-1 hour'));
$end = date('Y-m-d H:i:s', strtotime('+12 hours'));

$stmt = $conn->prepare("INSERT INTO flash_sale (nama_flash_sale, waktu_mulai, waktu_selesai, is_active) VALUES (?, ?, ?, 1)");
$stmt->bind_param("sss", $nama, $start, $end);
if ($stmt->execute()) {
    $fs_id = $stmt->insert_id;
    echo "Flash Sale created with ID: $fs_id\n";
    $stmt->close();
    
    // Insert items (Truffle Mushroom id 38, Oreo Ice Cream id 35)
    $stmt_item = $conn->prepare("INSERT INTO flash_sale_items (id_flash_sale, id_menu, harga_promo, stok_promo, stok_terjual) VALUES (?, ?, ?, ?, 0)");
    
    // Truffle Mushroom (id 38)
    $id_menu_1 = 38;
    $harga_promo_1 = 24000;
    $stok_promo_1 = 20;
    $stmt_item->bind_param("iidi", $fs_id, $id_menu_1, $harga_promo_1, $stok_promo_1);
    $stmt_item->execute();
    
    // Oreo Ice Cream (id 35)
    $id_menu_2 = 35;
    $harga_promo_2 = 20000;
    $stok_promo_2 = 15;
    $stmt_item->bind_param("iidi", $fs_id, $id_menu_2, $harga_promo_2, $stok_promo_2);
    $stmt_item->execute();
    
    echo "Items added to Flash Sale successfully!\n";
    $stmt_item->close();
} else {
    echo "Error: " . $stmt->error . "\n";
}
$conn->close();
?>

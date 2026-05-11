<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

$sql = "SELECT m.*, k.nama_kategori 
        FROM menu m 
        JOIN kategori_menu k ON m.id_kategori = k.id_kategori 
        ORDER BY m.id_menu DESC";
$result = $conn->query($sql);

$menu = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $menu[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $menu]);
$conn->close();
?>

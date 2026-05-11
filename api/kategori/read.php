<?php
header('Content-Type: application/json');
require_once '../../config/db.php';

$sql = "SELECT * FROM kategori_menu ORDER BY id_kategori ASC";
$result = $conn->query($sql);

$kategori = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $kategori[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $kategori]);
$conn->close();
?>

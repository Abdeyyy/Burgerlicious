<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$id_user    = $_SESSION['user_id'] ?? null;
$menu_nama  = $_POST['menu_nama'] ?? '';
$jumlah     = (int)($_POST['jumlah'] ?? 1);
$alamat     = trim($_POST['alamat'] ?? '');
$pengiriman = $_POST['pengiriman'] ?? '';
$pembayaran = $_POST['pembayaran'] ?? '';
$catatan    = trim($_POST['catatan'] ?? '');
$total      = (int)($_POST['total_harga'] ?? 0);

if (!$menu_nama || !$alamat || !$total) {
    echo json_encode(['status' => 'error', 'message' => 'Data pesanan tidak lengkap.']);
    exit;
}

try {
    $stmt = $conn->prepare('INSERT INTO pesanan (id_user, menu_nama, jumlah, alamat, pengiriman, pembayaran, catatan, total_harga) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('isissssi', $id_user, $menu_nama, $jumlah, $alamat, $pengiriman, $pembayaran, $catatan, $total);
    
    if ($stmt->execute()) {
        echo json_encode([
            'status' => 'success', 
            'message' => 'Pesanan berhasil disimpan!',
            'id_pesanan' => $stmt->insert_id
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan pesanan ke database.']);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()]);
}
$conn->close();
?>

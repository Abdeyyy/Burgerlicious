<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Silakan login terlebih dahulu.']);
    exit;
}

$id_user = $_SESSION['user_id'];

try {
    // Ambil semua transaksi milik user
    $query = "SELECT t.*, p.nama_promo 
              FROM transaksi t 
              LEFT JOIN promo p ON t.id_promo = p.id_promo
              WHERE t.id_user = ? 
              ORDER BY t.tanggal_transaksi DESC";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_user);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $orders = [];
    
    while ($row = $result->fetch_assoc()) {
        $id_transaksi = $row['id_transaksi'];
        
        // Ambil detail item untuk setiap transaksi
        $detail_query = "SELECT dt.*, m.nama_menu, m.gambar_url 
                         FROM detail_transaksi dt 
                         JOIN menu m ON dt.id_menu = m.id_menu 
                         WHERE dt.id_transaksi = ?";
                         
        $detail_stmt = $conn->prepare($detail_query);
        $detail_stmt->bind_param("i", $id_transaksi);
        $detail_stmt->execute();
        $detail_result = $detail_stmt->get_result();
        
        $items = [];
        while ($detail_row = $detail_result->fetch_assoc()) {
            $items[] = [
                'id_detail' => $detail_row['id_detail'],
                'id_menu' => $detail_row['id_menu'],
                'nama_menu' => $detail_row['nama_menu'],
                'gambar_url' => $detail_row['gambar_url'] ?? '',
                'jumlah' => (int)$detail_row['jumlah'],
                'harga_satuan' => (float)$detail_row['harga_satuan'],
                'subtotal' => (float)$detail_row['subtotal']
            ];
        }
        $detail_stmt->close();
        
        $orders[] = [
            'id_transaksi' => $row['id_transaksi'],
            'nama_pelanggan' => $row['nama_pelanggan'],
            'tipe_pesanan' => $row['tipe_pesanan'],
            'status_pesanan' => $row['status_pesanan'],
            'total_harga' => (float)$row['total_harga'],
            'nama_promo' => $row['nama_promo'] ?? null,
            'nilai_diskon' => (float)($row['nilai_diskon'] ?? 0.0),
            'tanggal_transaksi' => $row['tanggal_transaksi'],
            'items' => $items
        ];
    }
    
    $stmt->close();
    echo json_encode(['status' => 'success', 'data' => $orders]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal memuat riwayat pesanan: ' . $e->getMessage()]);
}
$conn->close();
?>

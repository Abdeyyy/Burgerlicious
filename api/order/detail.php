<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

// 1. Verify if user is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Anda harus login terlebih dahulu.']);
    exit;
}

$id_user = $_SESSION['user_id'];
$id_transaksi = isset($_GET['id_transaksi']) ? (int)$_GET['id_transaksi'] : 0;

if ($id_transaksi <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID Transaksi tidak valid.']);
    exit;
}

try {
    // 2. Fetch transaction details and check ownership (unless user is admin)
    $query = "SELECT t.*, p.kode_promo, p.nama_promo, p.deskripsi as deskripsi_promo,
                     TIMESTAMPDIFF(SECOND, t.tanggal_transaksi, NOW()) as elapsed_seconds
              FROM transaksi t 
              LEFT JOIN promo p ON t.id_promo = p.id_promo
              WHERE t.id_transaksi = ?";
              
    if (!isAdmin()) {
        $query .= " AND t.id_user = ?";
    }

    $stmt = $conn->prepare($query);
    if (!isAdmin()) {
        $stmt->bind_param("ii", $id_transaksi, $id_user);
    } else {
        $stmt->bind_param("i", $id_transaksi);
    }
    
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$order) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pesanan tidak ditemukan atau Anda tidak memiliki akses ke pesanan ini.']);
        exit;
    }

    // Auto-cancellation check for pending order (older than 10 minutes = 600 seconds)
    if ($order['status_pesanan'] === 'pending') {
        $elapsed_seconds = isset($order['elapsed_seconds']) ? (int)$order['elapsed_seconds'] : 0;
        
        if ($elapsed_seconds > 600) {
            $update_stmt = $conn->prepare("UPDATE transaksi SET status_pesanan = 'cancelled' WHERE id_transaksi = ?");
            $update_stmt->bind_param("i", $id_transaksi);
            $update_stmt->execute();
            $update_stmt->close();
            
            $order['status_pesanan'] = 'cancelled';
        }
    }

    // 3. Fetch item details for this transaction
    $detail_query = "SELECT dt.*, m.nama_menu, m.gambar_url 
                     FROM detail_transaksi dt 
                     JOIN menu m ON dt.id_menu = m.id_menu 
                     WHERE dt.id_transaksi = ?";
                     
    $detail_stmt = $conn->prepare($detail_query);
    $detail_stmt->bind_param("i", $id_transaksi);
    $detail_stmt->execute();
    $detail_result = $detail_stmt->get_result();

    $items = [];
    while ($row = $detail_result->fetch_assoc()) {
        $items[] = [
            'id_detail' => $row['id_detail'],
            'id_menu' => $row['id_menu'],
            'nama_menu' => $row['nama_menu'],
            'gambar_url' => $row['gambar_url'] ? '../../' . $row['gambar_url'] : '',
            'jumlah' => (int)$row['jumlah'],
            'harga_satuan' => (float)$row['harga_satuan'],
            'subtotal' => (float)$row['subtotal']
        ];
    }
    $detail_stmt->close();

    $order['items'] = $items;

    echo json_encode([
        'status' => 'success',
        'data' => $order
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil detail pesanan: ' . $e->getMessage()]);
}

$conn->close();
?>

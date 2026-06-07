<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

// 1. Check if user is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Anda harus login terlebih dahulu.']);
    exit;
}

$id_user = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$id_transaksi = isset($data['id_transaksi']) ? (int)$data['id_transaksi'] : 0;

if ($id_transaksi <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID Transaksi tidak valid.']);
    exit;
}

try {
    // 2. Check ownership and current status
    $stmt = $conn->prepare("SELECT id_transaksi, status_pesanan, tanggal_transaksi FROM transaksi WHERE id_transaksi = ? AND id_user = ?");
    $stmt->bind_param("ii", $id_transaksi, $id_user);
    $stmt->execute();
    $order = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$order) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.']);
        exit;
    }

    if ($order['status_pesanan'] !== 'pending') {
        echo json_encode(['status' => 'error', 'message' => 'Pesanan ini sudah tidak dalam status menunggu pembayaran.']);
        exit;
    }

    // 3. Check if it's already expired (older than 10 minutes = 600 seconds)
    $created_time = strtotime($order['tanggal_transaksi']);
    $elapsed = time() - $created_time;
    if ($elapsed > 600) {
        $upd = $conn->prepare("UPDATE transaksi SET status_pesanan = 'cancelled' WHERE id_transaksi = ?");
        $upd->bind_param("i", $id_transaksi);
        $upd->execute();
        $upd->close();
        echo json_encode(['status' => 'error', 'message' => 'Pesanan telah hangus karena melebihi batas waktu 10 menit.']);
        exit;
    }

    // 4. Update status to preparing (paid)
    $upd = $conn->prepare("UPDATE transaksi SET status_pesanan = 'preparing' WHERE id_transaksi = ?");
    $upd->bind_param("i", $id_transaksi);
    
    if ($upd->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Pembayaran berhasil dikonfirmasi!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengonfirmasi pembayaran.']);
    }
    $upd->close();

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan: ' . $e->getMessage()]);
}

$conn->close();
?>

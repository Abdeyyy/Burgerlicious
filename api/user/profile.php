<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

// Sambungkan ke database dan helper
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Silakan login terlebih dahulu.']);
    exit;
}

$id_user = $_SESSION['user_id'];

try {
    // 1. Ambil data dasar user
    $stmt = $conn->prepare("SELECT id_user, nama, email, telepon, alamat, foto_profil, is_verified FROM user WHERE id_user = ?");
    $stmt->bind_param('i', $id_user);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Pengguna tidak ditemukan.']);
        exit;
    }

    // 2. Hitung statistik dinamis
    // a. Total orders (completed)
    $stmt_orders = $conn->prepare("SELECT COUNT(*) as total_orders FROM transaksi WHERE id_user = ? AND status_pesanan = 'completed'");
    $stmt_orders->bind_param('i', $id_user);
    $stmt_orders->execute();
    $total_orders = (int)($stmt_orders->get_result()->fetch_assoc()['total_orders'] ?? 0);
    $stmt_orders->close();

    // b. Total spend (completed)
    $stmt_spend = $conn->prepare("SELECT SUM(total_harga) as total_spend FROM transaksi WHERE id_user = ? AND status_pesanan = 'completed'");
    $stmt_spend->bind_param('i', $id_user);
    $stmt_spend->execute();
    $total_spend = (float)($stmt_spend->get_result()->fetch_assoc()['total_spend'] ?? 0.0);
    $stmt_spend->close();

    // c. Favorite menu item
    $stmt_fav = $conn->prepare("
        SELECT m.nama_menu, SUM(dt.jumlah) as total_qty
        FROM detail_transaksi dt
        JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
        JOIN menu m ON dt.id_menu = m.id_menu
        WHERE t.id_user = ? AND t.status_pesanan = 'completed'
        GROUP BY dt.id_menu
        ORDER BY total_qty DESC, COUNT(dt.id_detail) DESC
        LIMIT 1
    ");
    $stmt_fav->bind_param('i', $id_user);
    $stmt_fav->execute();
    $fav_res = $stmt_fav->get_result()->fetch_assoc();
    $favorite_menu = $fav_res ? $fav_res['nama_menu'] : 'Belum memesan';
    $stmt_fav->close();

    // d. Loyalty tier calculation
    $loyalty_tier = 'Bronze Member';
    if ($total_orders >= 15) {
        $loyalty_tier = 'Gold Member';
    } else if ($total_orders >= 5) {
        $loyalty_tier = 'Silver Member';
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'id_user' => $user['id_user'],
            'nama' => $user['nama'],
            'email' => $user['email'],
            'telepon' => $user['telepon'] ?? '',
            'alamat' => $user['alamat'] ?? '',
            'foto_profil' => $user['foto_profil'] ?? '',
            'is_verified' => (int)$user['is_verified'],
            'stats' => [
                'total_orders' => $total_orders,
                'total_spend' => $total_spend,
                'favorite_menu' => $favorite_menu,
                'loyalty_tier' => $loyalty_tier
            ]
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal memuat profil: ' . $e->getMessage()]);
}
$conn->close();
?>

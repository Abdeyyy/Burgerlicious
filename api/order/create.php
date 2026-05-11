<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

// Only admins can create orders via this API (since it's for POS)
if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
    exit;
}

$nama_pelanggan = $data['nama_pelanggan'] ?? 'Pelanggan';
$tipe_pesanan = $data['tipe_pesanan'] ?? 'dine-in';
$items = $data['items'] ?? [];

if (empty($items)) {
    echo json_encode(['status' => 'error', 'message' => 'Pesanan kosong']);
    exit;
}

// Start transaction
$conn->begin_transaction();

try {
    // 1. Calculate total price and verify menus
    $total_harga = 0;
    foreach ($items as $item) {
        $id_menu = $item['id_menu'];
        $jumlah = $item['jumlah'];
        
        $stmt = $conn->prepare("SELECT harga FROM menu WHERE id_menu = ? AND status_tersedia = 1");
        $stmt->bind_param("i", $id_menu);
        $stmt->execute();
        $result = $stmt->get_result();
        $menu_data = $result->fetch_assoc();
        
        if (!$menu_data) {
            throw new Exception("Menu dengan ID $id_menu tidak tersedia");
        }
        
        $total_harga += $menu_data['harga'] * $jumlah;
        $stmt->close();
    }

    // 2. Insert into transaksi
    $stmt = $conn->prepare("INSERT INTO transaksi (nama_pelanggan, tipe_pesanan, total_harga, status_pesanan) VALUES (?, ?, ?, 'pending')");
    $stmt->bind_param("ssd", $nama_pelanggan, $tipe_pesanan, $total_harga);
    $stmt->execute();
    $id_transaksi = $stmt->insert_id;
    $stmt->close();

    // 3. Insert into detail_transaksi
    foreach ($items as $item) {
        $id_menu = $item['id_menu'];
        $jumlah = $item['jumlah'];
        
        $stmt = $conn->prepare("SELECT harga FROM menu WHERE id_menu = ?");
        $stmt->bind_param("i", $id_menu);
        $stmt->execute();
        $result = $stmt->get_result();
        $menu_data = $result->fetch_assoc();
        $harga_satuan = $menu_data['harga'];
        $subtotal = $harga_satuan * $jumlah;
        $stmt->close();

        $stmt = $conn->prepare("INSERT INTO detail_transaksi (id_transaksi, id_menu, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iiidd", $id_transaksi, $id_menu, $jumlah, $harga_satuan, $subtotal);
        $stmt->execute();
        $stmt->close();
    }

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Pesanan berhasil dibuat', 'id_transaksi' => $id_transaksi]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>

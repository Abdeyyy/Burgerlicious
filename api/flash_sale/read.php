<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

// Endpoint can be accessed by admin to manage, or public/mobile client to check active flash sales.
// But to prevent abuse, let's allow read for anyone but restrict detailed lists/creation to logged in users,
// or just allow read for all active ones. Let's make it flexible.

$id_flash_sale = isset($_GET['id_flash_sale']) ? (int)$_GET['id_flash_sale'] : 0;
$status_filter = isset($_GET['status']) ? trim($_GET['status']) : 'all';

if ($id_flash_sale > 0) {
    // Read single flash sale with details
    $stmt = $conn->prepare("SELECT * FROM flash_sale WHERE id_flash_sale = ?");
    $stmt->bind_param("i", $id_flash_sale);
    $stmt->execute();
    $flash_sale = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$flash_sale) {
        echo json_encode(['status' => 'error', 'message' => 'Flash Sale tidak ditemukan']);
        exit;
    }

    // Get items
    $items = [];
    $stmt_items = $conn->prepare("
        SELECT fsi.*, m.nama_menu, m.harga AS harga_normal, m.gambar_url 
        FROM flash_sale_items fsi
        JOIN menu m ON fsi.id_menu = m.id_menu
        WHERE fsi.id_flash_sale = ?
    ");
    $stmt_items->bind_param("i", $id_flash_sale);
    $stmt_items->execute();
    $res_items = $stmt_items->get_result();
    while ($row = $res_items->fetch_assoc()) {
        $items[] = [
            'id_flash_sale_item' => (int)$row['id_flash_sale_item'],
            'id_menu' => (int)$row['id_menu'],
            'nama_menu' => $row['nama_menu'],
            'harga_normal' => (float)$row['harga_normal'],
            'harga_promo' => (float)$row['harga_promo'],
            'stok_promo' => (int)$row['stok_promo'],
            'stok_terjual' => (int)$row['stok_terjual'],
            'gambar_url' => $row['gambar_url']
        ];
    }
    $stmt_items->close();

    $flash_sale['items'] = $items;
    echo json_encode(['status' => 'success', 'data' => $flash_sale]);
    $conn->close();
    exit;
}

// Read list of flash sales
$now = date('Y-m-d H:i:s');
$sql = "SELECT * FROM flash_sale ORDER BY waktu_mulai DESC";
$result = $conn->query($sql);

$flash_sales = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        // Compute status dynamically
        $start = $row['waktu_mulai'];
        $end = $row['waktu_selesai'];
        $is_active = (int)$row['is_active'];
        
        $computed_status = 'inactive';
        if ($is_active === 0) {
            $computed_status = 'inactive';
        } else if ($now < $start) {
            $computed_status = 'scheduled';
        } else if ($now > $end) {
            $computed_status = 'expired';
        } else {
            $computed_status = 'active';
        }
        
        $row['computed_status'] = $computed_status;
        
        // Fetch items summarization (count of items and total promo stock)
        $id_fs = (int)$row['id_flash_sale'];
        $sum_res = $conn->query("
            SELECT COUNT(*) as total_items, SUM(stok_promo) as total_stok, SUM(stok_terjual) as total_terjual 
            FROM flash_sale_items 
            WHERE id_flash_sale = $id_fs
        ");
        $sum_data = $sum_res->fetch_assoc();
        $row['item_count'] = (int)($sum_data['total_items'] ?? 0);
        $row['total_stok'] = (int)($sum_data['total_stok'] ?? 0);
        $row['total_terjual'] = (int)($sum_data['total_terjual'] ?? 0);

        // Apply status filter in PHP to be clean and simple
        if ($status_filter === 'all' || 
            ($status_filter === 'active' && $computed_status === 'active') ||
            ($status_filter === 'scheduled' && $computed_status === 'scheduled') ||
            ($status_filter === 'expired' && $computed_status === 'expired') ||
            ($status_filter === 'inactive' && $computed_status === 'inactive')) {
            $flash_sales[] = $row;
        }
    }
}

echo json_encode(['status' => 'success', 'data' => $flash_sales]);
$conn->close();
?>

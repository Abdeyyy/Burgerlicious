<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input']);
    exit;
}

$id_flash_sale = isset($input['id_flash_sale']) ? (int)$input['id_flash_sale'] : 0;
$nama_flash_sale = trim($input['nama_flash_sale'] ?? '');
$waktu_mulai = trim($input['waktu_mulai'] ?? '');
$waktu_selesai = trim($input['waktu_selesai'] ?? '');
$items = $input['items'] ?? [];

if ($id_flash_sale <= 0 || empty($nama_flash_sale) || empty($waktu_mulai) || empty($waktu_selesai)) {
    echo json_encode(['status' => 'error', 'message' => 'ID, nama, waktu mulai, dan waktu selesai wajib diisi']);
    exit;
}

if (strtotime($waktu_selesai) <= strtotime($waktu_mulai)) {
    echo json_encode(['status' => 'error', 'message' => 'Waktu selesai harus setelah waktu mulai']);
    exit;
}

if (empty($items)) {
    echo json_encode(['status' => 'error', 'message' => 'Minimal harus menambahkan 1 menu ke dalam Flash Sale']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. Update flash sale event
    $stmt = $conn->prepare("UPDATE flash_sale SET nama_flash_sale = ?, waktu_mulai = ?, waktu_selesai = ? WHERE id_flash_sale = ?");
    $stmt->bind_param("sssi", $nama_flash_sale, $waktu_mulai, $waktu_selesai, $id_flash_sale);
    if (!$stmt->execute()) {
        throw new Exception("Gagal memperbarui sesi flash sale");
    }
    $stmt->close();

    // 2. Fetch existing items in this flash sale
    $existing_items = [];
    $stmt_exist = $conn->prepare("SELECT id_menu, id_flash_sale_item FROM flash_sale_items WHERE id_flash_sale = ?");
    $stmt_exist->bind_param("i", $id_flash_sale);
    $stmt_exist->execute();
    $res_exist = $stmt_exist->get_result();
    while ($row = $res_exist->fetch_assoc()) {
        $existing_items[(int)$row['id_menu']] = (int)$row['id_flash_sale_item'];
    }
    $stmt_exist->close();

    $input_menu_ids = [];
    
    // 3. Insert or Update items
    $stmt_ins = $conn->prepare("INSERT INTO flash_sale_items (id_flash_sale, id_menu, harga_promo, stok_promo, stok_terjual) VALUES (?, ?, ?, ?, 0)");
    $stmt_upd = $conn->prepare("UPDATE flash_sale_items SET harga_promo = ?, stok_promo = ? WHERE id_flash_sale_item = ?");

    foreach ($items as $item) {
        $id_menu = (int)($item['id_menu'] ?? 0);
        $harga_promo = (float)($item['harga_promo'] ?? 0);
        $stok_promo = (int)($item['stok_promo'] ?? 10);

        if ($id_menu <= 0 || $harga_promo <= 0 || $stok_promo <= 0) {
            throw new Exception("Detail menu flash sale tidak valid");
        }

        $input_menu_ids[] = $id_menu;

        if (isset($existing_items[$id_menu])) {
            // Update existing item
            $id_flash_sale_item = $existing_items[$id_menu];
            $stmt_upd->bind_param("dii", $harga_promo, $stok_promo, $id_flash_sale_item);
            if (!$stmt_upd->execute()) {
                throw new Exception("Gagal memperbarui menu flash sale");
            }
        } else {
            // Insert new item
            $stmt_ins->bind_param("iidi", $id_flash_sale, $id_menu, $harga_promo, $stok_promo);
            if (!$stmt_ins->execute()) {
                throw new Exception("Gagal menambahkan menu baru ke flash sale");
            }
        }
    }
    
    $stmt_ins->close();
    $stmt_upd->close();

    // 4. Delete items that are no longer in input
    foreach ($existing_items as $ex_menu_id => $ex_item_id) {
        if (!in_array($ex_menu_id, $input_menu_ids)) {
            $stmt_del = $conn->prepare("DELETE FROM flash_sale_items WHERE id_flash_sale_item = ?");
            $stmt_del->bind_param("i", $ex_item_id);
            if (!$stmt_del->execute()) {
                throw new Exception("Gagal menghapus menu dari flash sale");
            }
            $stmt_del->close();
        }
    }

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Flash Sale berhasil diperbarui']);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>

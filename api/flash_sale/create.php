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

$nama_flash_sale = trim($input['nama_flash_sale'] ?? '');
$waktu_mulai = trim($input['waktu_mulai'] ?? '');
$waktu_selesai = trim($input['waktu_selesai'] ?? '');
$items = $input['items'] ?? [];

if (empty($nama_flash_sale) || empty($waktu_mulai) || empty($waktu_selesai)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama, waktu mulai, dan waktu selesai wajib diisi']);
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
    // Insert event
    $stmt = $conn->prepare("INSERT INTO flash_sale (nama_flash_sale, waktu_mulai, waktu_selesai, is_active) VALUES (?, ?, ?, 1)");
    $stmt->bind_param("sss", $nama_flash_sale, $waktu_mulai, $waktu_selesai);
    
    if (!$stmt->execute()) {
        throw new Exception("Gagal menyimpan sesi flash sale: " . $stmt->error);
    }
    
    $id_flash_sale = $stmt->insert_id;
    $stmt->close();
    
    // Insert items
    $stmt_item = $conn->prepare("INSERT INTO flash_sale_items (id_flash_sale, id_menu, harga_promo, stok_promo, stok_terjual) VALUES (?, ?, ?, ?, 0)");
    
    foreach ($items as $item) {
        $id_menu = (int)($item['id_menu'] ?? 0);
        $harga_promo = (float)($item['harga_promo'] ?? 0);
        $stok_promo = (int)($item['stok_promo'] ?? 10);
        
        if ($id_menu <= 0 || $harga_promo <= 0 || $stok_promo <= 0) {
            throw new Exception("Detail menu flash sale tidak valid");
        }
        
        $stmt_item->bind_param("iidi", $id_flash_sale, $id_menu, $harga_promo, $stok_promo);
        if (!$stmt_item->execute()) {
            throw new Exception("Gagal menyimpan menu flash sale: " . $stmt_item->error);
        }
    }
    
    $stmt_item->close();
    $conn->commit();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Flash Sale berhasil dibuat',
        'id_flash_sale' => $id_flash_sale
    ]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>

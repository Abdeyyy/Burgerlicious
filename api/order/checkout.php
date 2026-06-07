<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

// 1. Verify if user is logged in
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Anda harus login terlebih dahulu untuk membuat pesanan.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['status' => 'error', 'message' => 'Input tidak valid.']);
    exit;
}

$id_user = $_SESSION['user_id'];
$nama_pelanggan = $_SESSION['nama'];

$id_menu = isset($data['id_menu']) ? (int)$data['id_menu'] : 0;
$jumlah = isset($data['jumlah']) ? (int)$data['jumlah'] : 1;
$items = isset($data['items']) ? $data['items'] : [];
$alamat = isset($data['alamat']) ? trim($data['alamat']) : '';
$catatan = isset($data['catatan']) ? trim($data['catatan']) : '';
$pembayaran = isset($data['pembayaran']) ? trim($data['pembayaran']) : 'Transfer Bank';
$pengiriman = isset($data['pengiriman']) ? trim($data['pengiriman']) : 'instant';
$kode_promo = isset($data['kode_promo']) ? strtoupper(trim($data['kode_promo'])) : '';

// Convert single item to items array for unified processing if items is empty
if (empty($items) && $id_menu > 0) {
    $items = [['id_menu' => $id_menu, 'jumlah' => $jumlah]];
}

if (empty($items)) {
    echo json_encode(['status' => 'error', 'message' => 'Pesanan tidak boleh kosong.']);
    exit;
}

if (empty($alamat)) {
    echo json_encode(['status' => 'error', 'message' => 'Alamat pengiriman tidak boleh kosong.']);
    exit;
}

// Start transaction
$conn->begin_transaction();

try {
    $subtotal = 0;
    $verified_items = [];

    // 2. Verify all menu items availability
    foreach ($items as $item) {
        $item_id = isset($item['id_menu']) ? (int)$item['id_menu'] : 0;
        $item_qty = isset($item['jumlah']) ? (int)$item['jumlah'] : 0;

        if ($item_id <= 0 || $item_qty <= 0) {
            throw new Exception("Ada item dalam pesanan yang tidak valid.");
        }

        $stmt = $conn->prepare("SELECT id_menu, id_kategori, nama_menu, harga FROM menu WHERE id_menu = ? AND status_tersedia = 1");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        $menu = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$menu) {
            throw new Exception("Salah satu menu pilihan Anda sedang tidak tersedia.");
        }

        $harga_satuan = (float)$menu['harga'];
        $id_flash_sale_item = null;
        $is_flash_applied = false;

        // Check if request is from mobile and flash sale is active
        $is_mobile = (isset($_SERVER['HTTP_X_PLATFORM']) && $_SERVER['HTTP_X_PLATFORM'] === 'mobile');
        if ($is_mobile) {
            $stmt_fs = $conn->prepare("
                SELECT fsi.id_flash_sale_item, fsi.harga_promo, fsi.stok_promo, fsi.stok_terjual 
                FROM flash_sale_items fsi
                JOIN flash_sale fs ON fsi.id_flash_sale = fs.id_flash_sale
                WHERE fsi.id_menu = ? 
                  AND fs.is_active = 1 
                  AND NOW() BETWEEN fs.waktu_mulai AND fs.waktu_selesai
                LIMIT 1
            ");
            $stmt_fs->bind_param("i", $item_id);
            $stmt_fs->execute();
            $fs_res = $stmt_fs->get_result()->fetch_assoc();
            $stmt_fs->close();

            if ($fs_res) {
                $sisa_stok = $fs_res['stok_promo'] - $fs_res['stok_terjual'];
                if ($sisa_stok > 0) {
                    if ($item_qty > $sisa_stok) {
                        throw new Exception("Stok flash sale untuk " . $menu['nama_menu'] . " tidak mencukupi (Sisa stok: " . $sisa_stok . ").");
                    }
                    $harga_satuan = (float)$fs_res['harga_promo'];
                    $is_flash_applied = true;
                    $id_flash_sale_item = $fs_res['id_flash_sale_item'];
                }
            }
        }

        $item_subtotal = $harga_satuan * $item_qty;
        $subtotal += $item_subtotal;

        $verified_items[] = [
            'id_menu' => $item_id,
            'id_kategori' => (int)$menu['id_kategori'],
            'harga_satuan' => $harga_satuan,
            'jumlah' => $item_qty,
            'subtotal' => $item_subtotal,
            'id_flash_sale_item' => $id_flash_sale_item,
            'is_flash_applied' => $is_flash_applied
        ];
    }

    // 3. Determine shipping cost (ongkir)
    $ongkir = 12000; // default for instant
    if ($pengiriman === 'pickup') {
        $ongkir = 0;
    } else if ($pengiriman === 'hemat') {
        $ongkir = 7000;
    }

    // 4. Validate & calculate promo code if provided
    $id_promo = null;
    $nilai_diskon = 0;

    if (!empty($kode_promo)) {
        $today = date('Y-m-d');
        $stmt_promo = $conn->prepare("SELECT * FROM promo WHERE UPPER(kode_promo) = ? AND is_active = 1");
        $stmt_promo->bind_param("s", $kode_promo);
        $stmt_promo->execute();
        $promo = $stmt_promo->get_result()->fetch_assoc();
        $stmt_promo->close();

        if (!$promo) {
            throw new Exception("Kode promo tidak valid atau sudah tidak aktif.");
        }

        if ($promo['tanggal_mulai'] > $today || $promo['tanggal_selesai'] < $today) {
            throw new Exception("Kode promo berada di luar periode aktif.");
        }

        if ($promo['max_usage'] !== null && $promo['current_usage'] >= $promo['max_usage']) {
            throw new Exception("Kuota promo ini sudah habis.");
        }

        if ($subtotal < $promo['min_order']) {
            throw new Exception("Minimum pembelian Rp " . number_format($promo['min_order'], 0, ',', '.') . " tidak terpenuhi.");
        }

        $id_kategori_target = $promo['id_kategori_target'];
        
        // Apply discount check
        if ($promo['tipe_promo'] === 'percentage') {
            if ($id_kategori_target !== null) {
                $jumlah_kategori_target = 0;
                foreach ($verified_items as $vi) {
                    if ($vi['id_kategori'] === (int)$id_kategori_target) {
                        $jumlah_kategori_target += $vi['subtotal'];
                    }
                }
                if ($jumlah_kategori_target <= 0) {
                    throw new Exception("Promo hanya berlaku untuk kategori tertentu yang tidak ada di keranjang Anda.");
                }
                $nilai_diskon = $jumlah_kategori_target * ($promo['nilai_diskon'] / 100);
            } else {
                $nilai_diskon = $subtotal * ($promo['nilai_diskon'] / 100);
            }
        } else if ($promo['tipe_promo'] === 'fixed') {
            if ($id_kategori_target !== null) {
                $ada_kategori_target = false;
                foreach ($verified_items as $vi) {
                    if ($vi['id_kategori'] === (int)$id_kategori_target) {
                        $ada_kategori_target = true;
                        break;
                    }
                }
                if (!$ada_kategori_target) {
                    throw new Exception("Promo hanya berlaku untuk kategori tertentu yang tidak ada di keranjang Anda.");
                }
            }
            $nilai_diskon = min((float)$promo['nilai_diskon'], $subtotal);
        } else if ($promo['tipe_promo'] === 'bogo') {
            $eligible_items = [];
            foreach ($verified_items as $vi) {
                if ($id_kategori_target === null || $vi['id_kategori'] === (int)$id_kategori_target) {
                    for ($i = 0; $i < $vi['jumlah']; $i++) {
                        $eligible_items[] = $vi['harga_satuan'];
                    }
                }
            }

            if (count($eligible_items) < 2) {
                throw new Exception("Promo BOGO membutuhkan minimal pembelian 2 porsi.");
            }

            sort($eligible_items);
            $free_count = floor(count($eligible_items) / 2);
            for ($i = 0; $i < $free_count; $i++) {
                $nilai_diskon += $eligible_items[$i];
            }
        }

        $id_promo = $promo['id_promo'];
    }

    $final_total = max(0.00, $subtotal + $ongkir - $nilai_diskon);

    // 5. Insert transaction into transaksi table
    $tipe_pesanan = 'takeaway'; 
    $status_pesanan = 'pending';

    $stmt_ins = $conn->prepare("INSERT INTO transaksi (id_user, nama_pelanggan, tipe_pesanan, status_pesanan, total_harga, id_promo, nilai_diskon, alamat, catatan, metode_pembayaran, ongkir) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt_ins->bind_param("isssdidsssd", $id_user, $nama_pelanggan, $tipe_pesanan, $status_pesanan, $final_total, $id_promo, $nilai_diskon, $alamat, $catatan, $pembayaran, $ongkir);
    $stmt_ins->execute();
    $id_transaksi = $stmt_ins->insert_id;
    $stmt_ins->close();

    // 6. Insert detail transaction into detail_transaksi table
    $stmt_detail = $conn->prepare("INSERT INTO detail_transaksi (id_transaksi, id_menu, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)");
    foreach ($verified_items as $vi) {
        $stmt_detail->bind_param("iiidd", $id_transaksi, $vi['id_menu'], $vi['jumlah'], $vi['harga_satuan'], $vi['subtotal']);
        $stmt_detail->execute();

        // Increment stok_terjual if flash sale item was applied
        if ($vi['is_flash_applied'] && $vi['id_flash_sale_item'] !== null) {
            $fs_item_id = $vi['id_flash_sale_item'];
            $fs_qty = $vi['jumlah'];
            $conn->query("UPDATE flash_sale_items SET stok_terjual = stok_terjual + $fs_qty WHERE id_flash_sale_item = $fs_item_id");
        }
    }
    $stmt_detail->close();

    // 7. Increment promo usage if used
    if ($id_promo !== null) {
        $conn->query("UPDATE promo SET current_usage = current_usage + 1 WHERE id_promo = $id_promo");
    }

    $conn->commit();
    echo json_encode([
        'status' => 'success',
        'message' => 'Pesanan berhasil dibuat dan tersimpan di database!',
        'id_transaksi' => $id_transaksi
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>

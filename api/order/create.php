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
$id_user = isset($data['id_user']) && !empty($data['id_user']) ? (int)$data['id_user'] : null;
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

    // 2. Calculate promo discount if id_promo is provided
    $id_promo = isset($data['id_promo']) && !empty($data['id_promo']) ? (int)$data['id_promo'] : null;
    $nilai_diskon = 0;

    if ($id_promo !== null) {
        $stmt_promo = $conn->prepare("SELECT * FROM promo WHERE id_promo = ? AND is_active = 1");
        $stmt_promo->bind_param("i", $id_promo);
        $stmt_promo->execute();
        $promo = $stmt_promo->get_result()->fetch_assoc();
        $stmt_promo->close();

        if (!$promo) {
            throw new Exception("Promo tidak valid atau sudah tidak aktif");
        }

        $today = date('Y-m-d');
        if ($promo['tanggal_mulai'] > $today || $promo['tanggal_selesai'] < $today) {
            throw new Exception("Promo berada di luar periode aktif");
        }

        if ($promo['max_usage'] !== null && $promo['current_usage'] >= $promo['max_usage']) {
            throw new Exception("Kuota promo ini sudah habis");
        }

        if ($total_harga < $promo['min_order']) {
            throw new Exception("Minimum order Rp " . number_format($promo['min_order'], 0, ',', '.') . " tidak terpenuhi");
        }

        $id_kategori_target = $promo['id_kategori_target'];

        if ($promo['tipe_promo'] === 'percentage') {
            if ($id_kategori_target !== null) {
                $jumlah_kategori_target = 0;
                foreach ($items as $item) {
                    $stmt_cat = $conn->prepare("SELECT id_kategori, harga FROM menu WHERE id_menu = ?");
                    $stmt_cat->bind_param("i", $item['id_menu']);
                    $stmt_cat->execute();
                    $menu_info = $stmt_cat->get_result()->fetch_assoc();
                    $stmt_cat->close();

                    if ($menu_info && (int)$menu_info['id_kategori'] === (int)$id_kategori_target) {
                        $jumlah_kategori_target += (float)$menu_info['harga'] * (int)$item['jumlah'];
                    }
                }

                if ($jumlah_kategori_target <= 0) {
                    throw new Exception("Promo tidak berlaku untuk item pilihan Anda");
                }
                $nilai_diskon = $jumlah_kategori_target * ($promo['nilai_diskon'] / 100);
            } else {
                $nilai_diskon = $total_harga * ($promo['nilai_diskon'] / 100);
            }
        } else if ($promo['tipe_promo'] === 'fixed') {
            if ($id_kategori_target !== null) {
                $ada_kategori_target = false;
                foreach ($items as $item) {
                    $stmt_cat = $conn->prepare("SELECT id_kategori FROM menu WHERE id_menu = ?");
                    $stmt_cat->bind_param("i", $item['id_menu']);
                    $stmt_cat->execute();
                    $menu_info = $stmt_cat->get_result()->fetch_assoc();
                    $stmt_cat->close();

                    if ($menu_info && (int)$menu_info['id_kategori'] === (int)$id_kategori_target) {
                        $ada_kategori_target = true;
                        break;
                    }
                }
                if (!$ada_kategori_target) {
                    throw new Exception("Promo tidak berlaku untuk item pilihan Anda");
                }
            }
            $nilai_diskon = min((float)$promo['nilai_diskon'], $total_harga);
        } else if ($promo['tipe_promo'] === 'bogo') {
            $eligible_items = [];
            foreach ($items as $item) {
                $stmt_cat = $conn->prepare("SELECT id_kategori, harga FROM menu WHERE id_menu = ?");
                $stmt_cat->bind_param("i", $item['id_menu']);
                $stmt_cat->execute();
                $menu_info = $stmt_cat->get_result()->fetch_assoc();
                $stmt_cat->close();

                if ($menu_info && ($id_kategori_target === null || (int)$menu_info['id_kategori'] === (int)$id_kategori_target)) {
                    for ($i = 0; $i < (int)$item['jumlah']; $i++) {
                        $eligible_items[] = (float)$menu_info['harga'];
                    }
                }
            }

            if (count($eligible_items) >= 2) {
                sort($eligible_items);
                $free_count = floor(count($eligible_items) / 2);
                for ($i = 0; $i < $free_count; $i++) {
                    $nilai_diskon += $eligible_items[$i];
                }
            } else {
                throw new Exception("Syarat BOGO tidak terpenuhi");
            }
        }
    }

    $final_total_harga = max(0.00, $total_harga - $nilai_diskon);

    // 3. Insert into transaksi
    $stmt = $conn->prepare("INSERT INTO transaksi (id_user, nama_pelanggan, tipe_pesanan, total_harga, id_promo, nilai_diskon, status_pesanan) VALUES (?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->bind_param("issdid", $id_user, $nama_pelanggan, $tipe_pesanan, $final_total_harga, $id_promo, $nilai_diskon);
    $stmt->execute();
    $id_transaksi = $stmt->insert_id;
    $stmt->close();

    // 4. Insert into detail_transaksi
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

    // 5. Update promo usage & record to promo_usage
    if ($id_promo !== null) {
        $conn->query("UPDATE promo SET current_usage = current_usage + 1 WHERE id_promo = $id_promo");
        
        $stmt_usage = $conn->prepare("INSERT INTO promo_usage (id_promo, id_transaksi, nilai_potongan) VALUES (?, ?, ?)");
        $stmt_usage->bind_param("iid", $id_promo, $id_transaksi, $nilai_diskon);
        $stmt_usage->execute();
        $stmt_usage->close();
    }

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Pesanan berhasil dibuat', 'id_transaksi' => $id_transaksi]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
?>

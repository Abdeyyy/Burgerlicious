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
$alamat = isset($data['alamat']) ? trim($data['alamat']) : '';
$catatan = isset($data['catatan']) ? trim($data['catatan']) : '';
$pembayaran = isset($data['pembayaran']) ? trim($data['pembayaran']) : 'Transfer Bank';
$pengiriman = isset($data['pengiriman']) ? trim($data['pengiriman']) : 'instant';
$kode_promo = isset($data['kode_promo']) ? strtoupper(trim($data['kode_promo'])) : '';

if ($id_menu <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Menu tidak valid.']);
    exit;
}

if ($jumlah <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Jumlah pesanan minimal 1.']);
    exit;
}

if (empty($alamat)) {
    echo json_encode(['status' => 'error', 'message' => 'Alamat pengiriman tidak boleh kosong.']);
    exit;
}

// Start transaction
$conn->begin_transaction();

try {
    // 2. Verify menu availability
    $stmt = $conn->prepare("SELECT id_menu, id_kategori, nama_menu, harga FROM menu WHERE id_menu = ? AND status_tersedia = 1");
    $stmt->bind_param("i", $id_menu);
    $stmt->execute();
    $menu = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$menu) {
        throw new Exception("Menu tidak tersedia.");
    }

    $harga_satuan = (float)$menu['harga'];
    $subtotal = $harga_satuan * $jumlah;

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
            if ($id_kategori_target !== null && (int)$menu['id_kategori'] !== (int)$id_kategori_target) {
                throw new Exception("Promo ini tidak berlaku untuk kategori menu pilihan Anda.");
            }
            $nilai_diskon = $subtotal * ($promo['nilai_diskon'] / 100);
        } else if ($promo['tipe_promo'] === 'fixed') {
            if ($id_kategori_target !== null && (int)$menu['id_kategori'] !== (int)$id_kategori_target) {
                throw new Exception("Promo ini tidak berlaku untuk kategori menu pilihan Anda.");
            }
            $nilai_diskon = min((float)$promo['nilai_diskon'], $subtotal);
        } else if ($promo['tipe_promo'] === 'bogo') {
            if ($id_kategori_target !== null && (int)$menu['id_kategori'] !== (int)$id_kategori_target) {
                throw new Exception("Promo BOGO tidak berlaku untuk kategori menu pilihan Anda.");
            }
            if ($jumlah < 2) {
                throw new Exception("Promo BOGO membutuhkan minimal pembelian 2 porsi.");
            }
            $free_count = floor($jumlah / 2);
            $nilai_diskon = $free_count * $harga_satuan;
        }

        $id_promo = $promo['id_promo'];
    }

    $final_total = max(0.00, $subtotal + $ongkir - $nilai_diskon);

    // 5. Insert transaction into transaksi table
    // tipe_pesanan mapped to takeaway for checkout orders (as we deliver or they pickup)
    $tipe_pesanan = 'takeaway'; 
    $status_pesanan = 'pending';

    $stmt_ins = $conn->prepare("INSERT INTO transaksi (id_user, nama_pelanggan, tipe_pesanan, status_pesanan, total_harga, id_promo, nilai_diskon, alamat, catatan, metode_pembayaran, ongkir) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt_ins->bind_param("isssdidsssd", $id_user, $nama_pelanggan, $tipe_pesanan, $status_pesanan, $final_total, $id_promo, $nilai_diskon, $alamat, $catatan, $pembayaran, $ongkir);
    $stmt_ins->execute();
    $id_transaksi = $stmt_ins->insert_id;
    $stmt_ins->close();

    // 6. Insert detail transaction into detail_transaksi table
    $stmt_detail = $conn->prepare("INSERT INTO detail_transaksi (id_transaksi, id_menu, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)");
    $stmt_detail->bind_param("iiidd", $id_transaksi, $id_menu, $jumlah, $harga_satuan, $subtotal);
    $stmt_detail->execute();
    $stmt_detail->close();

    // 7. Increment promo usage & log if used
    if ($id_promo !== null) {
        $conn->query("UPDATE promo SET current_usage = current_usage + 1 WHERE id_promo = $id_promo");
        
        $stmt_usage = $conn->prepare("INSERT INTO promo_usage (id_promo, id_transaksi, nilai_potongan) VALUES (?, ?, ?)");
        $stmt_usage->bind_param("iid", $id_promo, $id_transaksi, $nilai_diskon);
        $stmt_usage->execute();
        $stmt_usage->close();
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

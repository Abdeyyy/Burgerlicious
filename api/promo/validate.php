<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

// POS validate promo code (accessible by logged-in admin users for POS)
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

$kode_promo = isset($data['kode_promo']) ? strtoupper(trim($data['kode_promo'])) : '';
$total_belanja = isset($data['total_belanja']) ? (float)$data['total_belanja'] : 0;
$items = isset($data['items']) ? $data['items'] : []; // Format: [['id_menu' => x, 'id_kategori' => y, 'harga' => z, 'jumlah' => w], ...]

if (empty($kode_promo)) {
    echo json_encode(['status' => 'error', 'message' => 'Kode promo tidak boleh kosong']);
    exit;
}

$today = date('Y-m-d');

// Cek promo di database
$stmt = $conn->prepare("SELECT * FROM promo WHERE UPPER(kode_promo) = ? AND is_active = 1");
$stmt->bind_param("s", $kode_promo);
$stmt->execute();
$result = $stmt->get_result();
$promo = $result->fetch_assoc();
$stmt->close();

if (!$promo) {
    echo json_encode(['status' => 'error', 'message' => 'Kode promo tidak valid atau sudah tidak aktif']);
    exit;
}

// 1. Validasi tanggal
if ($promo['tanggal_mulai'] > $today) {
    echo json_encode(['status' => 'error', 'message' => 'Promo belum dimulai. Aktif mulai tanggal ' . date('d-m-Y', strtotime($promo['tanggal_mulai']))]);
    exit;
}

if ($promo['tanggal_selesai'] < $today) {
    echo json_encode(['status' => 'error', 'message' => 'Promo sudah berakhir pada tanggal ' . date('d-m-Y', strtotime($promo['tanggal_selesai']))]);
    exit;
}

// 2. Validasi batas penggunaan
if ($promo['max_usage'] !== null && $promo['current_usage'] >= $promo['max_usage']) {
    echo json_encode(['status' => 'error', 'message' => 'Batas kuota penggunaan promo ini sudah habis']);
    exit;
}

// 3. Validasi minimum order
if ($total_belanja < $promo['min_order']) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Minimum pembelian untuk menggunakan promo ini adalah Rp ' . number_format($promo['min_order'], 0, ',', '.')
    ]);
    exit;
}

// 4. Hitung diskon berdasarkan tipe promo
$nilai_potongan = 0;
$id_kategori_target = $promo['id_kategori_target'];

if ($promo['tipe_promo'] === 'percentage') {
    if ($id_kategori_target !== null) {
        // Diskon persen hanya untuk kategori target
        $jumlah_kategori_target = 0;
        foreach ($items as $item) {
            if ((int)$item['id_kategori'] === (int)$id_kategori_target) {
                $jumlah_kategori_target += (float)$item['harga'] * (int)$item['jumlah'];
            }
        }
        
        if ($jumlah_kategori_target <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'Promo hanya berlaku untuk kategori tertentu yang tidak ada di keranjang Anda']);
            exit;
        }
        
        $nilai_potongan = $jumlah_kategori_target * ($promo['nilai_diskon'] / 100);
    } else {
        // Diskon persen untuk total belanja
        $nilai_potongan = $total_belanja * ($promo['nilai_diskon'] / 100);
    }
} else if ($promo['tipe_promo'] === 'fixed') {
    if ($id_kategori_target !== null) {
        // Cek apakah ada menu dari kategori target
        $ada_kategori_target = false;
        foreach ($items as $item) {
            if ((int)$item['id_kategori'] === (int)$id_kategori_target) {
                $ada_kategori_target = true;
                break;
            }
        }
        
        if (!$ada_kategori_target) {
            echo json_encode(['status' => 'error', 'message' => 'Promo hanya berlaku untuk kategori tertentu yang tidak ada di keranjang Anda']);
            exit;
        }
    }
    
    // Potongan harga tetap (tidak boleh melebihi total belanja)
    $nilai_potongan = min((float)$promo['nilai_diskon'], $total_belanja);
} else if ($promo['tipe_promo'] === 'bogo') {
    // Buy One Get One (BOGO)
    // Syarat: minimal 2 item dalam keranjang. Gratis 1 item termurah dari kategori target (jika diset) atau seluruh keranjang
    $eligible_items = [];
    foreach ($items as $item) {
        if ($id_kategori_target === null || (int)$item['id_kategori'] === (int)$id_kategori_target) {
            // Expand item berdasarkan jumlah
            for ($i = 0; $i < (int)$item['jumlah']; $i++) {
                $eligible_items[] = (float)$item['harga'];
            }
        }
    }
    
    if (count($eligible_items) < 2) {
        $msg = $id_kategori_target !== null 
            ? 'BOGO membutuhkan minimal 2 item dari kategori target' 
            : 'BOGO membutuhkan minimal 2 item di keranjang';
        echo json_encode(['status' => 'error', 'message' => $msg]);
        exit;
    }
    
    // Urutkan eligible items dari paling murah ke paling mahal
    sort($eligible_items);
    
    // Berapa banyak item gratis? Setiap kelipatan 2 dapat 1 gratis (maksimal 1 gratis per kelipatan)
    // Misal: beli 2 gratis 1 (bayar 1), beli 4 gratis 2 (bayar 2), beli 3 gratis 1 (bayar 2)
    $free_count = floor(count($eligible_items) / 2);
    
    for ($i = 0; $i < $free_count; $i++) {
        $nilai_potongan += $eligible_items[$i]; // Gratis item paling murah
    }
}

echo json_encode([
    'status' => 'success',
    'message' => 'Promo berhasil diterapkan',
    'data' => [
        'id_promo' => $promo['id_promo'],
        'nama_promo' => $promo['nama_promo'],
        'tipe_promo' => $promo['tipe_promo'],
        'nilai_diskon' => $promo['nilai_diskon'],
        'kode_promo' => $promo['kode_promo'],
        'nilai_potongan' => $nilai_potongan
    ]
]);

$conn->close();
?>

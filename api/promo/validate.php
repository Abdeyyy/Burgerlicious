<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

function translateDays($days_str) {
    $translations = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu'
    ];
    $days = array_map('trim', explode(',', $days_str));
    $translated = [];
    foreach ($days as $day) {
        $translated[] = $translations[$day] ?? $day;
    }
    return implode(', ', $translated);
}

// Validasi hari aktif jika diset
if (!empty($promo['hari_aktif'])) {
    $current_day = date('l');
    $active_days = array_map('trim', explode(',', $promo['hari_aktif']));
    if (!in_array($current_day, $active_days)) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'Promo ini hanya berlaku pada hari: ' . translateDays($promo['hari_aktif'])
        ]);
        exit;
    }
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
        $id_menu_target = $promo['id_menu_target'];
        $jumlah_target = 0;
        foreach ($items as $item) {
            if ((int)$item['id_kategori'] === (int)$id_kategori_target) {
                if ($id_menu_target === null || (int)$item['id_menu'] === (int)$id_menu_target) {
                    $jumlah_target += (float)$item['harga'] * (int)$item['jumlah'];
                }
            }
        }
        
        if ($jumlah_target <= 0) {
            $msg = $id_menu_target !== null 
                ? 'Promo hanya berlaku untuk menu tertentu yang tidak ada di keranjang Anda' 
                : 'Promo hanya berlaku untuk kategori tertentu yang tidak ada di keranjang Anda';
            echo json_encode(['status' => 'error', 'message' => $msg]);
            exit;
        }
        
        $nilai_potongan = $jumlah_target * ($promo['nilai_diskon'] / 100);
    } else {
        // Diskon persen untuk total belanja
        $nilai_potongan = $total_belanja * ($promo['nilai_diskon'] / 100);
    }
} else if ($promo['tipe_promo'] === 'fixed') {
    if ($id_kategori_target !== null) {
        $id_menu_target = $promo['id_menu_target'];
        $ada_target = false;
        $total_target_value = 0;
        foreach ($items as $item) {
            if ((int)$item['id_kategori'] === (int)$id_kategori_target) {
                if ($id_menu_target === null || (int)$item['id_menu'] === (int)$id_menu_target) {
                    $ada_target = true;
                    $total_target_value += (float)$item['harga'] * (int)$item['jumlah'];
                }
            }
        }
        
        if (!$ada_target) {
            $msg = $id_menu_target !== null 
                ? 'Promo hanya berlaku untuk menu tertentu yang tidak ada di keranjang Anda' 
                : 'Promo hanya berlaku untuk kategori tertentu yang tidak ada di keranjang Anda';
            echo json_encode(['status' => 'error', 'message' => $msg]);
            exit;
        }
        
        // Capped at the value of targeted items
        $nilai_potongan = min((float)$promo['nilai_diskon'], $total_target_value);
    } else {
        // Potongan harga tetap (tidak boleh melebihi total belanja)
        $nilai_potongan = min((float)$promo['nilai_diskon'], $total_belanja);
    }
} else if ($promo['tipe_promo'] === 'bogo') {
    // Buy One Get One (BOGO)
    // Syarat: minimal 2 item dalam keranjang. Gratis 1 item termurah dari menu/kategori target (jika diset) atau seluruh keranjang
    $id_menu_target = $promo['id_menu_target'];
    $eligible_items = [];
    foreach ($items as $item) {
        if ($id_kategori_target === null || (int)$item['id_kategori'] === (int)$id_kategori_target) {
            if ($id_menu_target === null || (int)$item['id_menu'] === (int)$id_menu_target) {
                // Expand item berdasarkan jumlah
                for ($i = 0; $i < (int)$item['jumlah']; $i++) {
                    $eligible_items[] = (float)$item['harga'];
                }
            }
        }
    }
    
    if (count($eligible_items) < 2) {
        $msg = $id_menu_target !== null 
            ? 'BOGO membutuhkan minimal 2 item dari menu target' 
            : ($id_kategori_target !== null 
                ? 'BOGO membutuhkan minimal 2 item dari kategori target' 
                : 'BOGO membutuhkan minimal 2 item di keranjang');
        echo json_encode(['status' => 'error', 'message' => $msg]);
        exit;
    }
    
    // Urutkan eligible items dari paling murah ke paling mahal
    sort($eligible_items);
    
    // Berapa banyak item gratis? Setiap kelipatan 2 dapat 1 gratis
    $free_count = floor(count($eligible_items) / 2);
    
    for ($i = 0; $i < $free_count; $i++) {
        $nilai_potongan += $eligible_items[$i]; // Gratis item paling murah
    }
} else if ($promo['tipe_promo'] === 'bundling') {
    // 1. Fetch requirements
    $stmt_req = $conn->prepare("SELECT * FROM promo_bundling_items WHERE id_promo = ?");
    $stmt_req->bind_param("i", $promo['id_promo']);
    $stmt_req->execute();
    $reqs_res = $stmt_req->get_result();
    $reqs = [];
    while ($r_row = $reqs_res->fetch_assoc()) {
        $reqs[] = $r_row;
    }
    $stmt_req->close();

    if (empty($reqs)) {
        echo json_encode(['status' => 'error', 'message' => 'Konfigurasi bundling untuk promo ini tidak ditemukan']);
        exit;
    }

    // 2. Query/normalize cart items to get database category and prices
    $cart_details = [];
    foreach ($items as $item) {
        $id_menu = (int)$item['id_menu'];
        $jumlah = (int)$item['jumlah'];
        
        $stmt_m = $conn->prepare("SELECT id_kategori, harga, nama_menu FROM menu WHERE id_menu = ? AND status_tersedia = 1");
        $stmt_m->bind_param("i", $id_menu);
        $stmt_m->execute();
        $menu_data = $stmt_m->get_result()->fetch_assoc();
        $stmt_m->close();
        
        if ($menu_data) {
            $cart_details[] = [
                'id_menu' => $id_menu,
                'id_kategori' => (int)$menu_data['id_kategori'],
                'harga' => (float)$menu_data['harga'],
                'jumlah' => $jumlah,
                'nama_menu' => $menu_data['nama_menu']
            ];
        }
    }

    // 3. Match and calculate discount
    $cart_qtys = [];
    foreach ($cart_details as $cd) {
        $cart_qtys[$cd['id_menu']] = [
            'id_kategori' => $cd['id_kategori'],
            'harga' => $cd['harga'],
            'qty' => $cd['jumlah']
        ];
    }

    $bundles_formed = 0;
    while (true) {
        $can_form_bundle = true;
        $temp_cart_qtys = $cart_qtys;
        $bundle_regular_price = 0;
        
        foreach ($reqs as $req) {
            $qty_needed = $req['jumlah'];
            
            if ($req['id_menu'] !== null) {
                $menu_id = $req['id_menu'];
                if (isset($temp_cart_qtys[$menu_id]) && $temp_cart_qtys[$menu_id]['qty'] >= $qty_needed) {
                    $temp_cart_qtys[$menu_id]['qty'] -= $qty_needed;
                    $bundle_regular_price += $temp_cart_qtys[$menu_id]['harga'] * $qty_needed;
                } else {
                    $can_form_bundle = false;
                    break;
                }
            } else if ($req['id_kategori'] !== null) {
                $cat_id = $req['id_kategori'];
                $qty_found = 0;
                
                foreach ($temp_cart_qtys as $m_id => &$cd_item) {
                    if ($cd_item['id_kategori'] === (int)$cat_id && $cd_item['qty'] > 0) {
                        $take = min($cd_item['qty'], $qty_needed - $qty_found);
                        $cd_item['qty'] -= $take;
                        $qty_found += $take;
                        $bundle_regular_price += $cd_item['harga'] * $take;
                        
                        if ($qty_found >= $qty_needed) {
                            break;
                        }
                    }
                }
                
                if ($qty_found < $qty_needed) {
                    $can_form_bundle = false;
                    break;
                }
            }
        }
        
        if ($can_form_bundle) {
            $cart_qtys = $temp_cart_qtys;
            $bundles_formed++;
            
            $special_price = (float)$promo['nilai_diskon'];
            $discount_for_set = max(0, $bundle_regular_price - $special_price);
            $nilai_potongan += $discount_for_set;
        } else {
            break;
        }
    }

    if ($bundles_formed === 0) {
        $req_strings = [];
        foreach ($reqs as $req) {
            if ($req['id_menu'] !== null) {
                $stmt_m_name = $conn->prepare("SELECT nama_menu FROM menu WHERE id_menu = ?");
                $stmt_m_name->bind_param("i", $req['id_menu']);
                $stmt_m_name->execute();
                $m_res = $stmt_m_name->get_result()->fetch_assoc();
                $stmt_m_name->close();
                $name = $m_res ? $m_res['nama_menu'] : 'Menu ID ' . $req['id_menu'];
                $req_strings[] = $req['jumlah'] . "x " . $name;
            } else if ($req['id_kategori'] !== null) {
                $stmt_c_name = $conn->prepare("SELECT nama_kategori FROM kategori_menu WHERE id_kategori = ?");
                $stmt_c_name->bind_param("i", $req['id_kategori']);
                $stmt_c_name->execute();
                $c_res = $stmt_c_name->get_result()->fetch_assoc();
                $stmt_c_name->close();
                $name = $c_res ? $c_res['nama_kategori'] : 'Kategori ID ' . $req['id_kategori'];
                $req_strings[] = $req['jumlah'] . "x dari kategori " . $name;
            }
        }
        echo json_encode([
            'status' => 'error', 
            'message' => 'Syarat paket bundling tidak terpenuhi. Anda harus membeli: ' . implode(" + ", $req_strings)
        ]);
        exit;
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

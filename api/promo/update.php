<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$id_promo = $_POST['id_promo'] ?? '';

if (empty($id_promo)) {
    echo json_encode(['status' => 'error', 'message' => 'ID promo wajib diisi']);
    exit;
}

// Ambil data promo yang ada
$check = $conn->prepare("SELECT * FROM promo WHERE id_promo = ?");
$check->bind_param("i", $id_promo);
$check->execute();
$existing = $check->get_result()->fetch_assoc();
$check->close();

if (!$existing) {
    echo json_encode(['status' => 'error', 'message' => 'Promo tidak ditemukan']);
    exit;
}

$nama_promo = $_POST['nama_promo'] ?? $existing['nama_promo'];
$deskripsi = $_POST['deskripsi'] ?? $existing['deskripsi'];
$tipe_promo = $_POST['tipe_promo'] ?? $existing['tipe_promo'];
$nilai_diskon = $_POST['nilai_diskon'] ?? $existing['nilai_diskon'];
$kode_promo = isset($_POST['kode_promo']) ? strtoupper(trim($_POST['kode_promo'])) : $existing['kode_promo'];
$min_order = $_POST['min_order'] ?? $existing['min_order'];
$max_usage = $_POST['max_usage'] ?? $existing['max_usage'];
$id_kategori_target = $_POST['id_kategori_target'] ?? $existing['id_kategori_target'];
$id_menu_target = isset($_POST['id_menu_target']) ? $_POST['id_menu_target'] : $existing['id_menu_target'];
$tanggal_mulai = $_POST['tanggal_mulai'] ?? $existing['tanggal_mulai'];
$tanggal_selesai = $_POST['tanggal_selesai'] ?? $existing['tanggal_selesai'];

$hari_aktif = $existing['hari_aktif'];
if (isset($_POST['nama_promo'])) {
    $hari_aktif_input = $_POST['hari_aktif'] ?? null;
    if (is_array($hari_aktif_input)) {
        $hari_aktif = implode(',', $hari_aktif_input);
    } else if (is_string($hari_aktif_input) && !empty($hari_aktif_input)) {
        $hari_aktif = $hari_aktif_input;
    } else {
        $hari_aktif = null;
    }
}

// Validasi kode promo unik (kecuali untuk promo ini sendiri)
if (!empty($kode_promo) && $kode_promo !== $existing['kode_promo']) {
    $check_kode = $conn->prepare("SELECT id_promo FROM promo WHERE kode_promo = ? AND id_promo != ?");
    $check_kode->bind_param("si", $kode_promo, $id_promo);
    $check_kode->execute();
    if ($check_kode->get_result()->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Kode promo sudah digunakan']);
        exit;
    }
    $check_kode->close();
}

// Handle empty optional fields
$kode_promo = !empty($kode_promo) ? $kode_promo : null;
$max_usage = !empty($max_usage) ? (int)$max_usage : null;
$id_kategori_target = !empty($id_kategori_target) ? (int)$id_kategori_target : null;
$id_menu_target = !empty($id_menu_target) ? (int)$id_menu_target : null;
$min_order = (float)$min_order;
$nilai_diskon = (float)$nilai_diskon;

// Handle upload gambar baru
$gambar_url = $existing['gambar_url'];
if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['gambar']['tmp_name'];
    $fileName = $_FILES['gambar']['name'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    $uploadFileDir = __DIR__ . '/../../assets/images/promo/';
    
    if (!is_dir($uploadFileDir)) {
        mkdir($uploadFileDir, 0777, true);
    }
    
    $upload_success = false;

    // Cek apakah ekstensi GD aktif
    if (function_exists('imagewebp')) {
        $newFileName = md5(time() . $fileName) . '.webp';
        $dest_path = $uploadFileDir . $newFileName;
        $image = null;
        
        if (($fileExtension == 'jpg' || $fileExtension == 'jpeg') && function_exists('imagecreatefromjpeg')) {
            $image = @imagecreatefromjpeg($fileTmpPath);
        } else if ($fileExtension == 'png' && function_exists('imagecreatefrompng')) {
            $image = @imagecreatefrompng($fileTmpPath);
            if ($image) {
                imagepalettetotruecolor($image);
                imagealphablending($image, false);
                imagesavealpha($image, true);
            }
        } else if ($fileExtension == 'webp' && function_exists('imagecreatefromwebp')) {
            $image = @imagecreatefromwebp($fileTmpPath);
        }

        if ($image) {
            // Hapus gambar lama jika ada
            if (!empty($existing['gambar_url'])) {
                $old_path = __DIR__ . '/../../' . $existing['gambar_url'];
                if (file_exists($old_path)) {
                    @unlink($old_path);
                }
            }
            if (@imagewebp($image, $dest_path, 80)) {
                $gambar_url = 'assets/images/promo/' . $newFileName;
                $upload_success = true;
            }
            imagedestroy($image);
        }
    }

    // Fallback: Jika GD tidak aktif atau konversi gagal, upload file asli secara langsung
    if (!$upload_success) {
        $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
        $dest_path = $uploadFileDir . $newFileName;
        if (move_uploaded_file($fileTmpPath, $dest_path)) {
            // Hapus gambar lama jika ada
            if (!empty($existing['gambar_url'])) {
                $old_path = __DIR__ . '/../../' . $existing['gambar_url'];
                if (file_exists($old_path)) {
                    @unlink($old_path);
                }
            }
            $gambar_url = 'assets/images/promo/' . $newFileName;
        }
    }
}

$stmt = $conn->prepare("UPDATE promo SET nama_promo=?, deskripsi=?, tipe_promo=?, nilai_diskon=?, kode_promo=?, min_order=?, max_usage=?, id_kategori_target=?, id_menu_target=?, gambar_url=?, tanggal_mulai=?, tanggal_selesai=?, hari_aktif=? WHERE id_promo=?");
$stmt->bind_param("sssdsdiiissssi", $nama_promo, $deskripsi, $tipe_promo, $nilai_diskon, $kode_promo, $min_order, $max_usage, $id_kategori_target, $id_menu_target, $gambar_url, $tanggal_mulai, $tanggal_selesai, $hari_aktif, $id_promo);

if ($stmt->execute()) {
    // If tipe_promo === 'bundling', update bundling items (delete and re-insert)
    if ($tipe_promo === 'bundling') {
        // Delete existing
        $conn->query("DELETE FROM promo_bundling_items WHERE id_promo = $id_promo");

        $bundling_types = $_POST['bundling_types'] ?? [];
        $bundling_menu_ids = $_POST['bundling_menu_ids'] ?? [];
        $bundling_category_ids = $_POST['bundling_category_ids'] ?? [];
        $bundling_qtys = $_POST['bundling_qtys'] ?? [];

        for ($i = 0; $i < count($bundling_types); $i++) {
            $type = $bundling_types[$i];
            $qty = isset($bundling_qtys[$i]) ? (int)$bundling_qtys[$i] : 1;
            $id_menu = null;
            $id_kategori = null;

            if ($type === 'menu' && !empty($bundling_menu_ids[$i])) {
                $id_menu = (int)$bundling_menu_ids[$i];
            } else if ($type === 'category' && !empty($bundling_category_ids[$i])) {
                $id_kategori = (int)$bundling_category_ids[$i];
            }

            if ($id_menu !== null || $id_kategori !== null) {
                $stmt_item = $conn->prepare("INSERT INTO promo_bundling_items (id_promo, id_menu, id_kategori, jumlah) VALUES (?, ?, ?, ?)");
                $stmt_item->bind_param("iiii", $id_promo, $id_menu, $id_kategori, $qty);
                $stmt_item->execute();
                $stmt_item->close();
            }
        }
    } else {
        // If updated from bundling to another type, delete existing bundling items
        $conn->query("DELETE FROM promo_bundling_items WHERE id_promo = $id_promo");
    }

    echo json_encode(['status' => 'success', 'message' => 'Promo berhasil diupdate']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal update promo: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

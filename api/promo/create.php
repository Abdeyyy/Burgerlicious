<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$nama_promo = $_POST['nama_promo'] ?? '';
$deskripsi = $_POST['deskripsi'] ?? '';
$tipe_promo = $_POST['tipe_promo'] ?? '';
$nilai_diskon = $_POST['nilai_diskon'] ?? 0;
$kode_promo = $_POST['kode_promo'] ?? null;
$min_order = $_POST['min_order'] ?? 0;
$max_usage = $_POST['max_usage'] ?? null;
$id_kategori_target = $_POST['id_kategori_target'] ?? null;
$tanggal_mulai = $_POST['tanggal_mulai'] ?? '';
$tanggal_selesai = $_POST['tanggal_selesai'] ?? '';

// Validasi input wajib
if (empty($nama_promo) || empty($tipe_promo) || empty($tanggal_mulai) || empty($tanggal_selesai)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama promo, tipe, tanggal mulai, dan tanggal selesai wajib diisi']);
    exit;
}

// Validasi tipe promo
$valid_types = ['percentage', 'fixed', 'bogo'];
if (!in_array($tipe_promo, $valid_types)) {
    echo json_encode(['status' => 'error', 'message' => 'Tipe promo tidak valid']);
    exit;
}

// Validasi nilai diskon untuk percentage dan fixed
if ($tipe_promo !== 'bogo' && (float)$nilai_diskon <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Nilai diskon harus lebih dari 0']);
    exit;
}

if ($tipe_promo === 'percentage' && (float)$nilai_diskon > 100) {
    echo json_encode(['status' => 'error', 'message' => 'Diskon persentase tidak boleh lebih dari 100%']);
    exit;
}

// Validasi kode promo unik jika diisi
if (!empty($kode_promo)) {
    $kode_promo = strtoupper(trim($kode_promo));
    $check_kode = $conn->prepare("SELECT id_promo FROM promo WHERE kode_promo = ?");
    $check_kode->bind_param("s", $kode_promo);
    $check_kode->execute();
    if ($check_kode->get_result()->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Kode promo sudah digunakan']);
        exit;
    }
    $check_kode->close();
} else {
    $kode_promo = null;
}

// Handle empty optional fields
$max_usage = !empty($max_usage) ? (int)$max_usage : null;
$id_kategori_target = !empty($id_kategori_target) ? (int)$id_kategori_target : null;
$min_order = (float)$min_order;
$nilai_diskon = (float)$nilai_diskon;

// Handle upload gambar
$gambar_url = null;
if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['gambar']['tmp_name'];
    $fileName = $_FILES['gambar']['name'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    $newFileName = md5(time() . $fileName) . '.webp';
    $uploadFileDir = '../../assets/images/promo/';
    
    if (!is_dir($uploadFileDir)) {
        mkdir($uploadFileDir, 0777, true);
    }
    
    $dest_path = $uploadFileDir . $newFileName;

    $image = null;
    if ($fileExtension == 'jpg' || $fileExtension == 'jpeg') {
        $image = imagecreatefromjpeg($fileTmpPath);
    } else if ($fileExtension == 'png') {
        $image = imagecreatefrompng($fileTmpPath);
        imagepalettetotruecolor($image);
        imagealphablending($image, true);
        imagesavealpha($image, true);
    } else if ($fileExtension == 'webp') {
        $image = imagecreatefromwebp($fileTmpPath);
    }

    if ($image) {
        if (imagewebp($image, $dest_path, 80)) {
            $gambar_url = 'assets/images/promo/' . $newFileName;
        }
        imagedestroy($image);
    }
}

$stmt = $conn->prepare("INSERT INTO promo (nama_promo, deskripsi, tipe_promo, nilai_diskon, kode_promo, min_order, max_usage, id_kategori_target, gambar_url, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssdsdiisss", $nama_promo, $deskripsi, $tipe_promo, $nilai_diskon, $kode_promo, $min_order, $max_usage, $id_kategori_target, $gambar_url, $tanggal_mulai, $tanggal_selesai);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Promo berhasil dibuat', 'id_promo' => $stmt->insert_id]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal membuat promo: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

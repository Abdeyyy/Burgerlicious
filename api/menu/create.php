<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$nama_menu = $_POST['nama_menu'] ?? '';
$id_kategori = $_POST['id_kategori'] ?? '';
$deskripsi = $_POST['deskripsi'] ?? '';
$harga = $_POST['harga'] ?? '';
$status_tersedia = $_POST['status_tersedia'] ?? 1;

if (empty($nama_menu) || empty($id_kategori) || empty($harga)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama, Kategori, dan Harga wajib diisi']);
    exit;
}

$gambar_url = null;

if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['gambar']['tmp_name'];
    $fileName = $_FILES['gambar']['name'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));
    
    $uploadFileDir = __DIR__ . '/../../assets/images/menu/';
    
    // Ensure directory exists
    if (!is_dir($uploadFileDir)) {
        mkdir($uploadFileDir, 0775, true);
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
            if (@imagewebp($image, $dest_path, 80)) {
                $gambar_url = 'assets/images/menu/' . $newFileName;
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
            $gambar_url = 'assets/images/menu/' . $newFileName;
        }
    }
}

$stmt = $conn->prepare("INSERT INTO menu (id_kategori, nama_menu, deskripsi, harga, gambar_url, status_tersedia) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("issdsi", $id_kategori, $nama_menu, $deskripsi, $harga, $gambar_url, $status_tersedia);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Menu berhasil ditambahkan']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal menambahkan menu: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>

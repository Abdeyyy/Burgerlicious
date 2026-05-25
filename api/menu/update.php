<?php
header('Content-Type: application/json');
require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
    exit;
}

$id_menu = $_POST['id_menu'] ?? null;
$nama_menu = $_POST['nama_menu'] ?? '';
$id_kategori = $_POST['id_kategori'] ?? '';
$deskripsi = $_POST['deskripsi'] ?? '';
$harga = $_POST['harga'] ?? '';
$status_tersedia = $_POST['status_tersedia'] ?? 1;

if (!$id_menu || empty($nama_menu) || empty($id_kategori) || empty($harga)) {
    echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap']);
    exit;
}

// Cek gambar lama
$stmt = $conn->prepare("SELECT gambar_url FROM menu WHERE id_menu = ?");
$stmt->bind_param("i", $id_menu);
$stmt->execute();
$old_image = $stmt->get_result()->fetch_assoc()['gambar_url'] ?? null;

$gambar_url = $old_image;

if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['gambar']['tmp_name'];
    $fileName = $_FILES['gambar']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
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
                // Hapus gambar lama jika ada
                $oldImagePath = __DIR__ . '/../../' . $old_image;
                if ($old_image && file_exists($oldImagePath)) {
                    @unlink($oldImagePath);
                }
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
            // Hapus gambar lama jika ada
            $oldImagePath = __DIR__ . '/../../' . $old_image;
            if ($old_image && file_exists($oldImagePath)) {
                @unlink($oldImagePath);
            }
            $gambar_url = 'assets/images/menu/' . $newFileName;
        }
    }
}

$stmt = $conn->prepare("UPDATE menu SET id_kategori = ?, nama_menu = ?, deskripsi = ?, harga = ?, gambar_url = ?, status_tersedia = ? WHERE id_menu = ?");
$stmt->bind_param("issdsii", $id_kategori, $nama_menu, $deskripsi, $harga, $gambar_url, $status_tersedia, $id_menu);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Menu berhasil diperbarui']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui menu']);
}

$stmt->close();
$conn->close();
?>

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
    
    $newFileName = md5(time() . $fileName) . '.webp';
    $uploadFileDir = '../../assets/images/menu/';
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
            // Hapus gambar lama jika ada
            if ($old_image && file_exists('../../' . $old_image)) {
                unlink('../../' . $old_image);
            }
            $gambar_url = 'assets/images/menu/' . $newFileName;
        }
        imagedestroy($image);
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

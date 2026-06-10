<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');

require_once '../../config/db.php';
require_once '../../auth/auth_helper.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Silakan login terlebih dahulu.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$id_user = $_SESSION['user_id'];
$nama    = trim($_POST['nama'] ?? '');
$telepon = trim($_POST['telepon'] ?? '');
$alamat  = trim($_POST['alamat'] ?? '');

if (!$nama) {
    echo json_encode(['status' => 'error', 'message' => 'Nama lengkap harus diisi.']);
    exit;
}

try {
    // Cari foto lama terlebih dahulu
    $stmt_old = $conn->prepare("SELECT foto_profil FROM user WHERE id_user = ?");
    $stmt_old->bind_param('i', $id_user);
    $stmt_old->execute();
    $old_res = $stmt_old->get_result()->fetch_assoc();
    $foto_profil = $old_res ? $old_res['foto_profil'] : '';
    $stmt_old->close();

    // Proses unggahan foto profil (Tugas 2.4)
    if (isset($_FILES['foto_profil']) && $_FILES['foto_profil']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['foto_profil'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['status' => 'error', 'message' => 'Gagal mengunggah berkas gambar.']);
            exit;
        }

        // Validasi ukuran (maksimal 2MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            echo json_encode(['status' => 'error', 'message' => 'Ukuran gambar maksimal 2MB.']);
            exit;
        }

        // Validasi tipe berkas
        $allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $file_type = mime_content_type($file['tmp_name']);
        if (!in_array($file_type, $allowed_types)) {
            echo json_encode(['status' => 'error', 'message' => 'Format berkas harus JPEG, PNG, WEBP, atau GIF.']);
            exit;
        }

        // Buat direktori penyimpanan jika belum ada
        $upload_dir = '../../assets/images/profile/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        // Buat nama file unik
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        if (!$ext) {
            $ext = str_replace('image/', '', $file_type);
        }
        $filename = 'profile_' . $id_user . '_' . uniqid() . '.' . $ext;
        $dest_path = $upload_dir . $filename;

        // Pindahkan berkas dari temp ke direktori tujuan
        if (move_uploaded_file($file['tmp_name'], $dest_path)) {
            // Hapus berkas foto lama jika ada
            if ($foto_profil && file_exists('../../' . $foto_profil) && strpos($foto_profil, 'default') === false) {
                @unlink('../../' . $foto_profil);
            }
            // Simpan path relatif baru
            $foto_profil = 'assets/images/profile/' . $filename;
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Gagal memindahkan berkas unggahan ke folder tujuan.']);
            exit;
        }
    }

    // Update database
    $stmt_upd = $conn->prepare("UPDATE user SET nama = ?, telepon = ?, alamat = ?, foto_profil = ? WHERE id_user = ?");
    $stmt_upd->bind_param('ssssi', $nama, $telepon, $alamat, $foto_profil, $id_user);

    if ($stmt_upd->execute()) {
        // Perbarui data nama di Session agar sinkron dengan sapaan di header
        $_SESSION['nama'] = $nama;
        $_SESSION['foto_profil'] = $foto_profil;

        echo json_encode([
            'status' => 'success',
            'message' => 'Profil berhasil diperbarui!',
            'data' => [
                'nama' => $nama,
                'telepon' => $telepon,
                'alamat' => $alamat,
                'foto_profil' => $foto_profil
            ]
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui profil di database.']);
    }
    $stmt_upd->close();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()]);
}
$conn->close();
?>

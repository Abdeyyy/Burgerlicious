<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$nama_menu = $_POST['nama_menu'] ?? 'test';
$id_kategori = $_POST['id_kategori'] ?? 1;
$harga = $_POST['harga'] ?? 10000;

echo "Upload test\n";

if (isset($_FILES['gambar'])) {
    echo "File uploaded: " . $_FILES['gambar']['name'] . "\n";
    $fileTmpPath = $_FILES['gambar']['tmp_name'];
    $fileName = $_FILES['gambar']['name'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));
    
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
    }
    
    if ($image) {
        if (imagewebp($image, $dest_path, 80)) {
            echo "Success webp\n";
        } else {
            echo "Failed webp\n";
        }
    } else {
        echo "Image is null\n";
    }
}
?>

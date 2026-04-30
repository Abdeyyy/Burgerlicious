<?php
$db_name = 'burgerlicious';

// Konfigurasi untuk Docker
$host_docker = 'db';
$user_docker = 'root';
$pass_docker = 'rootpassword';

// Konfigurasi untuk Laragon/XAMPP (Lokal)
$host_local = 'localhost';
$user_local = 'root';
$pass_local = ''; 

// Matikan exception otomatis untuk mysqli agar bisa ditangkap dengan gracefully
mysqli_report(MYSQLI_REPORT_OFF);

// Coba koneksi ke Docker
$conn = @new mysqli($host_docker, $user_docker, $pass_docker, $db_name);

if ($conn->connect_error) {
    // Jika gagal ke Docker, coba koneksi ke Laragon/Lokal
    $conn = @new mysqli($host_local, $user_local, $pass_local, $db_name);
    
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal (Docker & Lokal): ' . $conn->connect_error]);
        exit;
    }
}

$conn->set_charset('utf8mb4');
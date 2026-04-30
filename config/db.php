<?php
$host    = 'db';
$db      = 'burgerlicious';
$user    = 'root';
$pass    = 'rootpassword';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal: ' . $conn->connect_error]);
    exit;
}

$conn->set_charset('utf8mb4');
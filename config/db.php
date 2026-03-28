<?php
$host    = 'sql100.infinityfree.com';
$db      = 'if0_41496213_burgerlicious';
$user    = 'if0_41496213';
$pass    = 'BgEwbUd9M7kd';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal: ' . $conn->connect_error]);
    exit;
}

$conn->set_charset('utf8mb4');
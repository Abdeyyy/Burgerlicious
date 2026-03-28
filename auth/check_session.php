<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id']) && isset($_SESSION['nama'])) {
    echo json_encode([
        'loggedIn' => true,
        'nama' => $_SESSION['nama']
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}

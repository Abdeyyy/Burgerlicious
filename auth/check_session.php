<?php
require_once 'auth_helper.php';
header('Content-Type: application/json');

if (isLoggedIn()) {
    echo json_encode([
        'loggedIn' => true,
        'nama' => $_SESSION['nama']
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}

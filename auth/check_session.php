<?php
require_once 'auth_helper.php';
header('Content-Type: application/json');

if (isLoggedIn()) {
    echo json_encode([
        'loggedIn' => true,
        'user_id' => $_SESSION['user_id'],
        'nama' => $_SESSION['nama'],
        'role' => $_SESSION['role'] ?? 'customer',
        'foto_profil' => $_SESSION['foto_profil'] ?? ''
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}

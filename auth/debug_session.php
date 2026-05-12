<?php
require_once 'auth_helper.php';
header('Content-Type: application/json');

echo json_encode([
    'session' => $_SESSION,
    'isLoggedIn' => isLoggedIn(),
    'isAdmin' => isAdmin()
]);
?>

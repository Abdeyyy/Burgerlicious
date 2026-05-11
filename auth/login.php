<?php
// Compatibility endpoint (legacy)
// Redirect request ke MVC route.

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    // Forward POST fields to controller
    // controller akan membaca $_POST langsung
    require_once __DIR__ . '/../public/index.php';
    exit;
}

header('Location: ../public/pages/login.html');
exit;


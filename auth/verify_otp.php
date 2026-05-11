<?php
// Compatibility endpoint (legacy)

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    require_once __DIR__ . '/../public/index.php';
    exit;
}

header('Location: ../public/pages/verify.html');
exit;


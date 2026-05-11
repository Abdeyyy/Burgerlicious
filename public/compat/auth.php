<?php
// public/compat/auth.php
// Menjembatani legacy endpoint /auth/*.php ke route MVC

$route = $_GET['r'] ?? '';
if (!$route) {
    http_response_code(404);
    echo 'Route not found';
    exit;
}

require_once __DIR__ . '/../index.php';



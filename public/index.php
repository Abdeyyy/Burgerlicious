<?php
// Simple router for Burgerlicious
// Routes requests based on the 'r' parameter

$route = $_GET['r'] ?? '';

// Route mapping
$routes = [
    'auth.login' => __DIR__ . '/../auth/login.php',
    'auth.register' => __DIR__ . '/../auth/register.php',
    'auth.logout' => __DIR__ . '/../auth/logout.php',
    'auth.verify_otp' => __DIR__ . '/../auth/verify_otp.php',
    'auth.resend_otp' => __DIR__ . '/../auth/resend_otp.php',
    'auth.check_session' => __DIR__ . '/../auth/check_session.php',
];

if (isset($routes[$route]) && file_exists($routes[$route])) {
    include $routes[$route];
} else {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Route not found']);
}
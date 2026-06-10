<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';
require_once 'auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$recaptchaResponse = $_POST['g-recaptcha-response'] ?? '';

if (!$email || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Email dan password harus diisi.']);
    exit;
}

if (!$recaptchaResponse) {
    echo json_encode(['status' => 'error', 'message' => 'Silakan centang reCAPTCHA terlebih dahulu.']);
    exit;
}

// Verifikasi Google reCAPTCHA v2
$secretKey = RECAPTCHA_SECRET_KEY;
$verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

$data = [
    'secret'   => $secretKey,
    'response' => $recaptchaResponse,
    'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
];

$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data),
        'timeout' => 10
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
];

$context  = stream_context_create($options);
$response = @file_get_contents($verifyUrl, false, $context);

if ($response === false) {
    echo json_encode(['status' => 'error', 'message' => 'Gagal terhubung dengan server verifikasi CAPTCHA.']);
    exit;
}

$responseData = json_decode($response, true);

if (!$responseData || !isset($responseData['success']) || !$responseData['success']) {
    echo json_encode(['status' => 'error', 'message' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.']);
    exit;
}

// Mencari data user berdasarkan email
$stmt = $conn->prepare('SELECT * FROM user WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// Verifikasi Password
if (!$user || !password_verify($password, $user['pass'])) {
    echo json_encode(['status' => 'error', 'message' => 'Email atau password salah.']);
    exit;
}

if (isset($user['is_verified']) && $user['is_verified'] == 0) {
    echo json_encode(['status' => 'error', 'message' => 'Akun belum diverifikasi. Cek email Anda untuk OTP.']);
    exit;
}

// Set Sesi
$_SESSION['user_id'] = $user['id_user'];
$_SESSION['nama']    = $user['nama'];
$_SESSION['email']   = $user['email'];
$_SESSION['role']    = $user['role'] ?? 'customer';

// TOken Remember Me
$remember = isset($_POST['remember']) && $_POST['remember'] === '1';
if ($remember) {
    $selector = bin2hex(random_bytes(8));
    $validator = bin2hex(random_bytes(16));
    $token_hash = hash('sha256', $validator);
    $expires = date('Y-m-d H:i:s', time() + 30 * 24 * 60 * 60); // 30 hari

    $stmt_rem = $conn->prepare("INSERT INTO remember_tokens (id_user, selector, token_hash, expires_at) VALUES (?, ?, ?, ?)");
    if ($stmt_rem) {
        $stmt_rem->bind_param('isss', $user['id_user'], $selector, $token_hash, $expires);
        $stmt_rem->execute();
        $stmt_rem->close();
    }

    $is_secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    setcookie('remember_me', "$selector:$validator", [
        'expires' => time() + 30 * 24 * 60 * 60,
        'path' => '/',
        'secure' => $is_secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

echo json_encode([
    'status'  => 'success',
    'message' => 'Login berhasil!',
    'nama'    => $user['nama'],
    'role'    => $user['role'] ?? 'customer',
    'id_user' => $user['id_user']
]);
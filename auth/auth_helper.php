<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Inklusi koneksi database jika belum ada
if (!isset($conn)) {
    require_once __DIR__ . '/../config/db.php';
}

// AUTO-LOGIN MENGGUNAKAN REMEMBER ME COOKIE
if (!isset($_SESSION['user_id']) && isset($_COOKIE['remember_me'])) {
    $cookie_parts = explode(':', $_COOKIE['remember_me']);
    if (count($cookie_parts) === 2) {
        $selector = $cookie_parts[0];
        $validator = $cookie_parts[1];

        // Cari token di database yang belum kadaluwarsa
        $now = date('Y-m-d H:i:s');
        $stmt_token = $conn->prepare("SELECT * FROM remember_tokens WHERE selector = ? AND expires_at > ?");
        if ($stmt_token) {
            $stmt_token->bind_param('ss', $selector, $now);
            $stmt_token->execute();
            $token_res = $stmt_token->get_result()->fetch_assoc();
            $stmt_token->close();

            if ($token_res) {
                // Verifikasi validator token
                $calc_hash = hash('sha256', $validator);
                if (hash_equals($token_res['token_hash'], $calc_hash)) {
                    // Ambil detail user
                    $stmt_user = $conn->prepare("SELECT * FROM user WHERE id_user = ?");
                    if ($stmt_user) {
                        $stmt_user->bind_param('i', $token_res['id_user']);
                        $stmt_user->execute();
                        $user = $stmt_user->get_result()->fetch_assoc();
                        $stmt_user->close();

                        if ($user && ($user['is_verified'] == 1)) {
                            // Set Session login
                            $_SESSION['user_id'] = $user['id_user'];
                            $_SESSION['nama']    = $user['nama'];
                            $_SESSION['email']   = $user['email'];
                            $_SESSION['role']    = $user['role'] ?? 'customer';

                            // ROTASI TOKEN (Hapus token lama, buat token baru)
                            $new_selector = bin2hex(random_bytes(8));
                            $new_validator = bin2hex(random_bytes(16));
                            $new_hash = hash('sha256', $new_validator);
                            $new_expires = date('Y-m-d H:i:s', time() + 30 * 24 * 60 * 60);

                            // Hapus token lama
                            $stmt_del = $conn->prepare("DELETE FROM remember_tokens WHERE id = ?");
                            if ($stmt_del) {
                                $stmt_del->bind_param('i', $token_res['id']);
                                $stmt_del->execute();
                                $stmt_del->close();
                            }

                            // Simpan token baru
                            $stmt_ins = $conn->prepare("INSERT INTO remember_tokens (id_user, selector, token_hash, expires_at) VALUES (?, ?, ?, ?)");
                            if ($stmt_ins) {
                                $stmt_ins->bind_param('isss', $user['id_user'], $new_selector, $new_hash, $new_expires);
                                $stmt_ins->execute();
                                $stmt_ins->close();
                            }

                            // Kirim cookie baru
                            $is_secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
                            setcookie('remember_me', "$new_selector:$new_validator", [
                                'expires' => time() + 30 * 24 * 60 * 60,
                                'path' => '/',
                                'secure' => $is_secure,
                                'httponly' => true,
                                'samesite' => 'Lax'
                            ]);
                        }
                    }
                } else {
                    // Token tidak cocok (potensi pencurian token / manipulasi cookie)
                    // Hapus token dari database untuk keamanan
                    $stmt_del = $conn->prepare("DELETE FROM remember_tokens WHERE selector = ?");
                    if ($stmt_del) {
                        $stmt_del->bind_param('s', $selector);
                        $stmt_del->execute();
                        $stmt_del->close();
                    }
                    // Hapus cookie
                    setcookie('remember_me', '', time() - 3600, '/');
                }
            } else {
                // Token tidak ditemukan atau expired
                setcookie('remember_me', '', time() - 3600, '/');
            }
        }
    }
}

// 2. PROTEKSI CSRF
// Generate CSRF Token jika belum ada
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Set cookie XSRF-TOKEN untuk dibaca oleh frontend JS
if (!headers_sent()) {
    $is_secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    setcookie('XSRF-TOKEN', $_SESSION['csrf_token'], [
        'expires' => 0, // session cookie
        'path' => '/',
        'secure' => $is_secure,
        'httponly' => false, // Harus false agar JS bisa membacanya
        'samesite' => 'Lax'
    ]);
}

// Verifikasi CSRF pada request POST, PUT, DELETE, PATCH
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE', 'PATCH'])) {
    $current_uri = $_SERVER['REQUEST_URI'];
    // Abaikan verifikasi untuk API publik di auth/
    if (strpos($current_uri, '/auth/login.php') === false && 
        strpos($current_uri, '/auth/register.php') === false &&
        strpos($current_uri, '/auth/verify_otp.php') === false &&
        strpos($current_uri, '/auth/resend_otp.php') === false &&
        strpos($current_uri, '/auth/forgot_password.php') === false &&
        strpos($current_uri, '/auth/reset_password.php') === false) {
        
        $token = $_SERVER['HTTP_X_XSRF_TOKEN'] ?? '';
        if (!$token || !hash_equals($_SESSION['csrf_token'], $token)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Akses Ditolak: Token CSRF tidak valid. Silakan muat ulang halaman.']);
            exit;
        }
    }
}

function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['nama']);
}

function isAdmin() {
    return isLoggedIn() && isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}
?>



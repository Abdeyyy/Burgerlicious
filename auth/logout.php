<?php
session_start();

// Hapus token remember me dari database jika ada
if (isset($_COOKIE['remember_me'])) {
    $cookie_parts = explode(':', $_COOKIE['remember_me']);
    if (count($cookie_parts) === 2) {
        $selector = $cookie_parts[0];
        require_once __DIR__ . '/../config/db.php';
        $stmt = $conn->prepare("DELETE FROM remember_tokens WHERE selector = ?");
        if ($stmt) {
            $stmt->bind_param('s', $selector);
            $stmt->execute();
            $stmt->close();
        }
    }
    // Hapus cookie remember_me
    setcookie('remember_me', '', time() - 3600, '/');
}

// Hapus sesi dan bersihkan kukieee
session_destroy();
setcookie(session_name(), '', 0, '/'); 

// Redirect kembali ke index.html
header("Location: ../index.html");
exit;
?>


<?php
namespace App\Controllers;

class RouteMap {
    public static function detectLegacyAuthRoute(string $uriPath): ?string {
        $p = strtolower(str_replace('\\', '/', $uriPath));
        // contoh: /auth/login.php
        if (str_ends_with($p, '/auth/login.php')) return 'auth.login';
        if (str_ends_with($p, '/auth/register.php')) return 'auth.register';
        if (str_ends_with($p, '/auth/verify_otp.php')) return 'auth.verifyOtp';
        if (str_ends_with($p, '/auth/check_session.php')) return 'auth.checkSession';
        if (str_ends_with($p, '/auth/logout.php')) return 'auth.logout';
        return null;
    }
}


<?php
namespace App\Controllers;

class PageAssetsController extends BaseController {
    public function about(): void {
        $this->render('pages/about', ['pageTitle' => 'About Us - Burgerlicious']);
    }

    public function menu(): void {
        $this->render('pages/menu', ['pageTitle' => 'Menu - Burgerlicious']);
    }

    public function promo(): void {
        $this->render('pages/promo', ['pageTitle' => 'Promo - Burgerlicious']);
    }

    public function login(): void {
        $this->render('pages/auth/login', ['pageTitle' => 'Login - Burgerlicious']);
    }

    public function register(): void {
        $this->render('pages/auth/register', ['pageTitle' => 'Register - Burgerlicious']);
    }

    public function verify(): void {
        $this->render('pages/auth/verify', ['pageTitle' => 'Verifikasi OTP - Burgerlicious']);
    }

    public function profile(): void {
        $this->render('pages/profile', ['pageTitle' => 'Profil Saya - Burgerlicious']);
    }

    public function dashboard(): void {
        $this->render('pages/admin/dashboard', ['pageTitle' => 'Admin Dashboard - Burgerlicious']);
    }
}


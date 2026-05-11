<?php
namespace App\Controllers;

use App\Models\UserModel;
use mysqli;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


class AuthController extends BaseController {
    private function json(array $payload, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($payload);
        exit;
    }

    private function getDb(): mysqli {
        require_once __DIR__ . '/../../config/db.php';
        // $conn dihasilkan oleh config/db.php
        /** @var mysqli $conn */
        return $conn;
    }

    public function checkSession(): void {
        session_start();
        $this->json([
            'loggedIn' => isset($_SESSION['user_id'], $_SESSION['nama']),
            'nama' => $_SESSION['nama'] ?? null,
            'email' => $_SESSION['email'] ?? null,
        ]);
    }

    public function login(): void {
        session_start();
        $this->requirePost();

        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) {
            $this->json(['status' => 'error', 'message' => 'Email dan password harus diisi.'], 400);
        }

        $conn = $this->getDb();
        $userModel = new UserModel($conn);
        $user = $userModel->findByEmail($email);

        if (!$user || !password_verify($password, $user['pass'])) {
            $this->json(['status' => 'error', 'message' => 'Email atau password salah.'], 401);
        }

        if (isset($user['is_verified']) && (int)$user['is_verified'] === 0) {
            $this->json(['status' => 'error', 'message' => 'Akun belum diverifikasi. Cek email Anda untuk OTP.'], 403);
        }

        $_SESSION['user_id'] = $user['id_user'];
        $_SESSION['nama'] = $user['nama'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'] ?? 'customer';

        $this->json([
            'status' => 'success',
            'message' => 'Login berhasil!',
            'nama' => $user['nama'],
            'role' => $user['role'] ?? 'customer',
        ]);
    }

    public function logout(): void {
        session_start();
        session_destroy();
        setcookie(session_name(), '', 0, '/');
        header('Location: ../index.html');
        exit;
    }

    public function register(): void {
        session_start();
        $this->requirePost();
        date_default_timezone_set('Asia/Jakarta');

        $nama = trim($_POST['nama'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $confirm = $_POST['confirmPassword'] ?? '';

        if (!$nama || !$email || !$password || !$confirm) {
            $this->json(['status' => 'error', 'message' => 'Semua field harus diisi.'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->json(['status' => 'error', 'message' => 'Format email tidak valid.'], 400);
        }
        if (strlen($password) < 6) {
            $this->json(['status' => 'error', 'message' => 'Password minimal 6 karakter.'], 400);
        }
        if ($password !== $confirm) {
            $this->json(['status' => 'error', 'message' => 'Password tidak cocok.'], 400);
        }

        $conn = $this->getDb();
        $userModel = new UserModel($conn);

        // Cek apakah email sudah ada
        $existing = $userModel->findByEmail($email);
        if ($existing) {
            if ((int)($existing['is_verified'] ?? 0) === 1) {
                $this->json(['status' => 'error', 'message' => 'Email sudah terdaftar dan terverifikasi. Silakan login.'], 409);
            }
            // Hapus record untuk re-register
            $userModel->deleteById((int)$existing['id_user']);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $otp = sprintf('%06d', mt_rand(1, 999999));
        $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        $ok = $userModel->create($nama, $email, $hash, $otp, $expires);
        if (!$ok) {
            $this->json(['status' => 'error', 'message' => 'Gagal mendaftar ke database.'], 500);
        }

        // Setup PHPMailer
        require_once __DIR__ . '/../../auth/PHPMailer/Exception.php';
        require_once __DIR__ . '/../../auth/PHPMailer/PHPMailer.php';
        require_once __DIR__ . '/../../auth/PHPMailer/SMTP.php';

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'burgerliciousdelicious@gmail.com';
            $mail->Password = 'gjao ossl wztp gqme';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = 465;

            $mail->setFrom('burgerliciousdelicious@gmail.com', 'Burgerlicious');
            $mail->addAddress($email, $nama);

            $mail->isHTML(true);
            $mail->Subject = 'Kode Verifikasi Burgerlicious Anda';

            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                    <h2 style='color: #BA0000; text-align: center;'>Welcome to Burgerlicious!</h2>
                    <p>Halo <b>{$nama}</b>,</p>
                    <p>Terima kasih telah mendaftar. Untuk mengaktifkan akun Anda, silakan masukkan kode verifikasi 6 digit berikut pada halaman verifikasi:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <span style='background-color: #FEBB19; color: #BA0000; font-size: 28px; font-weight: bold; letter-spacing: 5px; padding: 15px 30px; border-radius: 10px; display: inline-block;'>{$otp}</span>
                    </div>
                    <p style='color: #888; text-align: center; font-size: 13px;'>Kode ini akan kedaluwarsa dalam 15 menit.</p>
                    <hr style='border-top: 1px solid #eee; margin-top: 30px;'>
                    <p style='color: #aaa; text-align: center; font-size: 12px;'>&copy; 2026 Burgerlicious. All Rights Reserved.</p>
                </div>
            ";

            $mail->send();

            $this->json([
                'status' => 'success',
                'message' => 'Registrasi berhasil! Kode OTP telah dikirim ke email Anda.',
                'requires_verification' => true,
            ]);
        } catch (Exception $e) {
            $this->json([
                'status' => 'error',
                'message' => "Registrasi berhasil, tetapi email gagal terkirim. Error: {$mail->ErrorInfo}",
            ], 500);
        }
    }

    public function verifyOtp(): void {
        session_start();
        $this->requirePost();

        $email = trim($_POST['email'] ?? '');
        $otp = trim($_POST['otp'] ?? '');

        if (!$email || !$otp) {
            $this->json(['status' => 'error', 'message' => 'Email dan OTP harus diisi.'], 400);
        }

        $conn = $this->getDb();
        $userModel = new UserModel($conn);

        $ok = $userModel->activateByEmail($email, $otp);
        if ($ok) {
            $this->json(['status' => 'success', 'message' => 'Verifikasi berhasil! Mengalihkan ke halaman login...']);
        }

        // fallback message
        $this->json(['status' => 'error', 'message' => 'Kode OTP salah atau sudah kadaluarsa.'], 400);
    }

    private function requirePost(): void {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['status' => 'error', 'message' => 'Method tidak diizinkan.'], 405);
        }
    }
}


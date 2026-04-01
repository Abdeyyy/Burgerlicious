<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
session_start();
date_default_timezone_set('Asia/Jakarta');
header('Content-Type: application/json');
require_once '../config/db.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once 'PHPMailer/Exception.php';
require_once 'PHPMailer/PHPMailer.php';
require_once 'PHPMailer/SMTP.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
    exit;
}

$email = trim($_POST['email'] ?? '');

if (!$email) {
    echo json_encode(['status' => 'error', 'message' => 'Email kosong.']);
    exit;
}

// Cek apakah email terdaftar dan belum verified
$stmt = $conn->prepare('SELECT id_user, nama, is_verified FROM user WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'Email tidak terdaftar.']);
    exit;
}

if ($user['is_verified'] == 1) {
    echo json_encode(['status' => 'error', 'message' => 'Akun sudah diverifikasi. Silakan login.']);
    exit;
}

// Update OTP
$otp = sprintf("%06d", mt_rand(1, 999999));
$expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

$stmt_upd = $conn->prepare('UPDATE user SET verification_code = ?, code_expires_at = ? WHERE email = ?');
$stmt_upd->bind_param('sss', $otp, $expires, $email);
$stmt_upd->execute();
$stmt_upd->close();

// --- SEND EMAIL VIA PHPMAILER ---
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'burgerliciousdelicious@gmail.com';
    $mail->Password   = 'gjao ossl wztp gqme';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            
    $mail->Port       = 465;

    $mail->setFrom('burgerliciousdelicious@gmail.com', 'Burgerlicious');
    $mail->addAddress($email, $user['nama']);

    $mail->isHTML(true);
    $mail->Subject = 'Kirim Ulang: Kode Verifikasi Burgerlicious';
    $mail->Body    = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
        <h2 style='color: #BA0000; text-align: center;'>Welcome Back to Burgerlicious!</h2>
        <p>Halo <b>{$user['nama']}</b>,</p>
        <p>Anda meminta untuk mengirim ulang kode verifikasi. Silakan masukkan kode 6 digit berikut pada halaman verifikasi:</p>
        <div style='text-align: center; margin: 30px 0;'>
            <span style='background-color: #FEBB19; color: #BA0000; font-size: 28px; font-weight: bold; letter-spacing: 5px; padding: 15px 30px; border-radius: 10px; display: inline-block;'>$otp</span>
        </div>
        <p style='color: #888; text-align: center; font-size: 13px;'>Kode ini akan kedaluwarsa dalam 15 menit.</p>
        <hr style='border-top: 1px solid #eee; margin-top: 30px;'>
        <p style='color: #aaa; text-align: center; font-size: 12px;'>&copy; ".date('Y')." Burgerlicious. All Rights Reserved.</p>
    </div>
    ";

    $mail->send();
    echo json_encode(['status' => 'success', 'message' => 'Kode OTP yang baru berhasil dikirim ke email Anda.']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => "Gagal mengirim ulang email OTP. Error: {$mail->ErrorInfo}"]);
}

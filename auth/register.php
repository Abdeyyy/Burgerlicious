<?php
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

$nama     = trim($_POST['nama'] ?? '');
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$confirm  = $_POST['confirmPassword'] ?? '';

if (!$nama || !$email || !$password || !$confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Semua field harus diisi.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Format email tidak valid.']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password minimal 6 karakter.']);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(['status' => 'error', 'message' => 'Password tidak cocok.']);
    exit;
}

// Cek apakah alamat email tersebut sudah pernah didaftarkan
$stmt = $conn->prepare('SELECT id_user, is_verified FROM user WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user_exists = $result->fetch_assoc();
$stmt->close();

if ($user_exists) {
    if ($user_exists['is_verified'] == 1) {
        echo json_encode(['status' => 'error', 'message' => 'Email sudah terdaftar dan terverifikasi. Silakan login.']);
        exit;
    } else {
        $stmt_del = $conn->prepare("DELETE FROM user WHERE id_user = ?");
        $stmt_del->bind_param("i", $user_exists['id_user']);
        $stmt_del->execute();
        $stmt_del->close();
    }
}

// Pembuatan hash dan otp
$hash = password_hash($password, PASSWORD_DEFAULT);
$otp = sprintf("%06d", mt_rand(1, 999999));
$expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

// Masukkan record/data baru pengguna ke dalam tabel Database user
$stmt = $conn->prepare('INSERT INTO user (nama, email, pass, is_verified, verification_code, code_expires_at) VALUES (?, ?, ?, 0, ?, ?)');
$stmt->bind_param('sssss', $nama, $email, $hash, $otp, $expires);
if(!$stmt->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Gagal mendaftar ke database.']);
    exit;
}
$stmt->close();

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
    $mail->addAddress($email, $nama);

    $mail->isHTML(true);
    $mail->Subject = 'Kode Verifikasi Burgerlicious Anda';
    $mail->Body    = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
        <h2 style='color: #BA0000; text-align: center;'>Welcome to Burgerlicious!</h2>
        <p>Halo <b>$nama</b>,</p>
        <p>Terima kasih telah mendaftar. Untuk mengaktifkan akun Anda, silakan masukkan kode verifikasi 6 digit berikut pada halaman verifikasi:</p>
        <div style='text-align: center; margin: 30px 0;'>
            <span style='background-color: #FEBB19; color: #BA0000; font-size: 28px; font-weight: bold; letter-spacing: 5px; padding: 15px 30px; border-radius: 10px; display: inline-block;'>$otp</span>
        </div>
        <p style='color: #888; text-align: center; font-size: 13px;'>Kode ini akan kedaluwarsa dalam 15 menit.</p>
        <hr style='border-top: 1px solid #eee; margin-top: 30px;'>
        <p style='color: #aaa; text-align: center; font-size: 12px;'>&copy; 2026 Burgerlicious. All Rights Reserved.</p>
    </div>
    ";

    $mail->send();
    echo json_encode(['status' => 'success', 'message' => 'Registrasi berhasil! Kode OTP telah dikirim ke email Anda.', 'requires_verification' => true]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => "Registrasi berhasil, tetapi email gagal terkirim. Error: {$mail->ErrorInfo}"]);
}
<?php
namespace App\Models;

use mysqli;

class UserModel {
    private mysqli $conn;

    public function __construct(mysqli $conn) {
        $this->conn = $conn;
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->conn->prepare('SELECT * FROM user WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc() ?: null;
        $stmt->close();
        return $user;
    }

    public function create(string $nama, string $email, string $passHash, string $otp, string $expiresAt): bool {
        $stmt = $this->conn->prepare(
            'INSERT INTO user (nama, email, pass, is_verified, verification_code, code_expires_at) VALUES (?, ?, ?, 0, ?, ?)'
        );
        $stmt->bind_param('sssss', $nama, $email, $passHash, $otp, $expiresAt);
        $ok = $stmt->execute();
        $stmt->close();
        return (bool)$ok;
    }

    public function deleteById(int $idUser): bool {
        $stmt = $this->conn->prepare('DELETE FROM user WHERE id_user = ?');
        $stmt->bind_param('i', $idUser);
        $ok = $stmt->execute();
        $stmt->close();
        return (bool)$ok;
    }

    public function activateByEmail(string $email, string $otp): bool {
        $stmt = $this->conn->prepare('SELECT id_user, is_verified, verification_code, code_expires_at FROM user WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc() ?: null;
        $stmt->close();

        if (!$user) return false;
        if ((int)($user['is_verified'] ?? 0) === 1) return false;

        if (($user['verification_code'] ?? null) !== $otp) return false;

        $current = date('Y-m-d H:i:s');
        if ($user['code_expires_at'] === null || $current > $user['code_expires_at']) return false;

        $stmt2 = $this->conn->prepare("UPDATE user SET is_verified = 1, verification_code = '', code_expires_at = '2000-01-01 00:00:00' WHERE email = ?");
        $stmt2->bind_param('s', $email);
        $ok = $stmt2->execute();
        $stmt2->close();
        return (bool)$ok;
    }
}


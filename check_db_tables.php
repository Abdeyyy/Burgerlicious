<?php
header('Content-Type: text/html; charset=utf-8');
require_once 'config/db.php';

echo "<h2>Diagnostics Database - Burgerlicious</h2>";
echo "<p><strong>Host:</strong> $db_host</p>";
echo "<p><strong>User:</strong> $db_user</p>";
echo "<p><strong>Database:</strong> $db_name</p>";

if (!$conn) {
    echo "<p style='color: red;'><strong>Status:</strong> Koneksi database gagal terinisialisasi.</p>";
    exit;
}

if ($conn->connect_error) {
    echo "<p style='color: red;'><strong>Status:</strong> Koneksi database gagal: " . $conn->connect_error . "</p>";
    exit;
}

echo "<p style='color: green;'><strong>Status:</strong> Koneksi database sukses!</p>";

$tables = ['user', 'kategori_menu', 'menu', 'transaksi', 'detail_transaksi', 'promo', 'promo_bundling_items', 'remember_tokens', 'flash_sale', 'flash_sale_items'];

echo "<h3>Daftar Tabel & Jumlah Data:</h3>";
echo "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; min-width: 300px;'>";
echo "<tr style='background-color: #f2f2f2;'><th>Nama Tabel</th><th>Jumlah Baris (Data)</th><th>Status</th></tr>";

foreach ($tables as $table) {
    // Periksa apakah tabel ada
    $check_table = $conn->query("SHOW TABLES LIKE '$table'");
    if ($check_table && $check_table->num_rows > 0) {
        $count_res = $conn->query("SELECT COUNT(*) FROM `$table`");
        $count = $count_res ? $count_res->fetch_row()[0] : 'Error';
        
        $status = "<span style='color: green;'>Siap</span>";
        if ($count == 0) {
            $status = "<span style='color: orange;'>Kosong</span>";
        }
        
        echo "<tr><td><code>$table</code></td><td align='center'>$count</td><td>$status</td></tr>";
    } else {
        echo "<tr><td><code>$table</code></td><td align='center' style='color: red;'>Tidak Ada</td><td><span style='color: red;'>Belum Dibuat</span></td></tr>";
    }
}
echo "</table>";

// Cari tahu apakah ada data menu
$check_menu_exist = $conn->query("SHOW TABLES LIKE 'menu'");
if ($check_menu_exist && $check_menu_exist->num_rows > 0) {
    $menu_count_res = $conn->query("SELECT COUNT(*) FROM `menu`");
    $menu_count = $menu_count_res ? $menu_count_res->fetch_row()[0] : 0;
    
    if ($menu_count == 0) {
        echo "<div style='margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px; color: #856404;'>";
        echo "<strong>Peringatan:</strong> Tabel <code>menu</code> Anda kosong. Ini alasan mengapa menu tidak muncul di website.<br><br>";
        echo "<strong>Solusi:</strong><br>";
        echo "1. Jalankan script setup otomatis dengan membuka URL ini di browser Anda: <a href='setup_db.php' target='_blank'>burgerlicious.page.gd/setup_db.php</a><br>";
        echo "2. Atau, impor file SQL backup <code>burgerlicious.sql</code> dari folder Downloads Anda menggunakan phpMyAdmin di Control Panel InfinityFree.";
        echo "</div>";
    } else {
        echo "<p style='color: green; margin-top: 20px;'><strong>Info:</strong> Tabel <code>menu</code> memiliki $menu_count menu. Jika masih tidak muncul di frontend, periksa log error di PHP atau konsol browser Anda.</p>";
    }
} else {
    echo "<div style='margin-top: 20px; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; color: #721c24;'>";
    echo "<strong>Peringatan:</strong> Tabel <code>menu</code> belum ada di database!<br><br>";
    echo "<strong>Solusi:</strong> Silakan buka URL berikut untuk membuat tabel dan data awal secara otomatis: <a href='setup_db.php' target='_blank'>burgerlicious.page.gd/setup_db.php</a>";
    echo "</div>";
}

$conn->close();
?>

<?php
require 'config/db.php';
$res = $conn->query("SELECT * FROM promo");
if ($res) {
    print_r($res->fetch_all(MYSQLI_ASSOC));
}
?>

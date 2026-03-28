<?php
session_start();
session_destroy();
setcookie(session_name(), '', 0, '/'); // Clear session cookie

// Redirect kembali ke index.html
header("Location: ../index.html");
exit;

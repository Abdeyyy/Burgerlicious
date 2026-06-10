<?php
header('Content-Type: application/json');
require_once 'config/db.php';

$response = [];

// 1. Check database connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Db connection failed: ' . $conn->connect_error]);
    exit;
}

$response['connection'] = 'success';

// 2. Get columns of promo table
$result = $conn->query("DESCRIBE `promo`");
$columns = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row;
    }
    $response['promo_columns'] = $columns;
} else {
    $response['promo_columns_error'] = $conn->error;
}

// 3. Get columns of promo_bundling_items table
$result_bundling = $conn->query("DESCRIBE `promo_bundling_items`");
$columns_bundling = [];
if ($result_bundling) {
    while ($row = $result_bundling->fetch_assoc()) {
        $columns_bundling[] = $row;
    }
    $response['promo_bundling_columns'] = $columns_bundling;
} else {
    $response['promo_bundling_columns_error'] = $conn->error;
}

echo json_encode($response, JSON_PRETTY_PRINT);
$conn->close();
?>

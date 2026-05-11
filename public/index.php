<?php
// public/index.php - Front Controller sederhana untuk MVC

declare(strict_types=1);

// Autoload minimal untuk namespace App\...
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';
    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }
    $relativeClass = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

// Route parameter: ?r=controller.method
$route = $_GET['r'] ?? 'hello.index';

// Compatibility: bila dipanggil dari legacy /auth/*.php, kita set route berdasarkan path.
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
if ($uriPath) {
    $legacyRoute = \App\Controllers\RouteMap::detectLegacyAuthRoute($uriPath);
    if ($legacyRoute) {
        $route = $legacyRoute;
    }
}

$parts = explode('.', $route, 2);

if (count($parts) !== 2) {
    http_response_code(404);
    echo 'Route not found';
    exit;
}

$controllerKey = strtolower($parts[0]);
$method = $parts[1];

// Map controller key -> class (konservatif, tanpa magic).
$map = [
    'hello'      => \App\Controllers\HelloController::class,
    'auth'       => \App\Controllers\AuthController::class,
    'pageassets' => \App\Controllers\PageAssetsController::class,
];


$controllerClass = $map[$controllerKey] ?? null;
if (!$controllerClass) {
    http_response_code(404);
    echo 'Controller not found';
    exit;
}

$controller = new $controllerClass();

if (!method_exists($controller, $method)) {
    http_response_code(404);
    echo 'Method not found';
    exit;
}

$controller->{$method}();


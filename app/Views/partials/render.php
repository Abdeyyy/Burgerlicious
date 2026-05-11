<?php
// app/Views/partials/render.php
// Helper sederhana untuk render view dengan layout.

function render(string $view, array $data = []): void {
    $baseViewPath = __DIR__ . '/../../Views/';
    $layoutPath   = __DIR__ . '/../layouts/app.php';

    $viewPath = $baseViewPath . $view . '.php';
    if (!file_exists($viewPath)) {
        http_response_code(500);
        echo "View not found: " . htmlspecialchars($view);
        return;
    }

    // supaya layout bisa include view
    $viewContentFile = $viewPath;

    // Extract data supaya variabel tersedia di layout.
    extract($data, EXTR_SKIP);

    include $layoutPath;
}


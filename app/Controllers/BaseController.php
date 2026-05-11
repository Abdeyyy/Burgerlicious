<?php
namespace App\Controllers;

abstract class BaseController {
    protected function render(string $view, array $data = []): void {
        // render() global dari app/Views/partials/render.php
        require_once __DIR__ . '/../Views/partials/render.php';
        render($view, $data);
    }
}


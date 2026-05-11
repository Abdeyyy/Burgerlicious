<?php
namespace App\Controllers;

class HelloController extends BaseController {
    public function index(): void {
        $this->render('pages/hello', [
            'pageTitle' => 'Burgerlicious',
        ]);
    }
}


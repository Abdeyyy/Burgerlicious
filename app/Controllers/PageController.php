<?php
namespace App\Controllers;

class PageController extends BaseController {
    public function hello(): void {
        $this->render('pages/hello', ['pageTitle' => 'Burgerlicious']);
    }
}


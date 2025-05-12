<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

App\Bootstrap::boot()
    ->createContainer() // Zde docházelo k chybě
    ->getByType(Nette\Application\Application::class)
    ->run();
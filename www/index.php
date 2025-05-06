<?php
declare(strict_types=1);

// ÚPLNĚ NA ZAČÁTEK SOUBORU PRO LADĚNÍ BÍLÉ STRÁNKY:
// ini_set('display_errors', '1');
// ini_set('display_startup_errors', '1');
// error_reporting(E_ALL);
// KONEC LADICÍCH ŘÁDKŮ

// Cesta k souboru autoload.php z Composeru (o úroveň výše než www/)
require __DIR__ . '/../vendor/autoload.php';

// Nastartování aplikace pomocí Bootstrap třídy
// App\Bootstrap::boot() vrátí instanci Nette\Bootstrap\Configurator
App\Bootstrap::boot()
    ->createContainer()  // 1. Vytvoří DI kontejner
    ->getByType(Nette\Application\Application::class) // 2. Z kontejneru získá službu Application
    ->run(); // 3. Spustí aplikaci
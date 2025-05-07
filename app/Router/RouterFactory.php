<?php

declare(strict_types=1);

namespace App\Router;

use Nette;
use Nette\Application\Routers\RouteList;
use Nette\Application\Routers\Route;


final class RouterFactory
{
    use Nette\StaticClass;

    public static function createRouter(): RouteList
{
    $router = new RouteList;

    // Admin Module - musí být první pro správnou prioritu
    $router->addRoute('admin/<presenter>/<action>[/<id>]', [
        'module' => 'Admin',
        'presenter' => 'Homepage',
        'action' => 'default',
    ]);

    // Explicitní routa pro dashboard
    $router->addRoute('dashboard[/<action>[/<id>]]', [
        'presenter' => 'Dashboard',
        'action' => 'default',
    ]);

    // Výchozí routa pro domovskou stránku
    $router->addRoute('', [
        'presenter' => 'Dashboard',
        'action' => 'default',
    ]);

    // Obecná routa pro ostatní presentery
    $router->addRoute('<presenter>/<action>[/<id>]', [
        'presenter' => 'Dashboard',
        'action' => 'default',
    ]);

    return $router;
}
}
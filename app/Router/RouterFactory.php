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

        // Front-end - výchozí routa pro doménu (bez /dashboard)
        $router->addRoute('', 'Dashboard:default', Route::ONE_WAY);

        // Front-end - routa pro ostatní uživatelské části
        $router->addRoute('<presenter>/<action>[/<id>]', 'Dashboard:default');

        // Admin Module - tato routa musí být před výchozí, aby se vyhodnotila jako první
        $router->addRoute('/admin/<presenter>/<action>[/<id>]', 'Admin:Homepage:default');

        return $router;
    }
}
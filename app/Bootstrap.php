<?php
declare(strict_types=1);
namespace App;
use Nette\Bootstrap\Configurator;
use Nette\DI\ContainerLoader;

class Bootstrap {
    public static function boot(): Configurator {
        $configurator = new Configurator;
        $appDir = dirname(__DIR__);

        $configurator->setDebugMode(true);
        $configurator->enableTracy($appDir . '/log');
        $configurator->setTimeZone('Europe/Prague');
        $configurator->setTempDirectory($appDir . '/temp');

        $configurator->createRobotLoader()
            ->addDirectory(__DIR__) // Skenuje app/
            ->register();

        $configurator->addConfig($appDir . '/config/common.neon');
        $configurator->addConfig($appDir . '/config/local.neon'); // Načítá local (s novou DSN strukturou)

        return $configurator;
    }
}
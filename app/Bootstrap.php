<?php
declare(strict_types=1);

namespace App;

use Nette\Bootstrap\Configurator;
use Nette\DI\ContainerLoader;

class Bootstrap {
    public static function boot(): Configurator {
        $configurator = new Configurator;
        $appDir = dirname(__DIR__);

        // Povolení debug režimu pro Tracy Debugger
        // Můžete omezit debug režim pouze na konkrétní IP adresy
        $configurator->setDebugMode(getenv('NETTE_DEBUG') === '1' || in_array($_SERVER['REMOTE_ADDR'] ?? '', ['78.44.56.154', '::1']));

        // Aktivace Tracy Debuggeru a nastavení složky pro logy
        $configurator->enableTracy($appDir . '/log');

        // Nastavení časové zóny a dočasné složky
        $configurator->setTimeZone('Europe/Prague');
        $configurator->setTempDirectory($appDir . '/temp');

        // Aktivace RobotLoaderu pro automatické načítání tříd
        $configurator->createRobotLoader()
            ->addDirectory(__DIR__) // Skenuje app/
            ->register();

        // Načítání konfigurace
        $configurator->addConfig($appDir . '/config/common.neon');
        $configurator->addConfig($appDir . '/config/local.neon'); // Načítá local (s novou DSN strukturou)

        return $configurator;
    }
}
<?php
declare(strict_types=1);

namespace App\Presenters;

use Nette;

final class Error4xxPresenter extends Nette\Application\UI\Presenter
{
    public function startup(): void
    {
        parent::startup();
        if (!$this->getRequest()->hasFlag(Nette\Application\Request::RESTORED)) {
            $this->error();
        }
    }

    public function renderDefault(Nette\Application\BadRequestException $exception): void
    {
        // loads template ../templates/Error/4xx.latte
        $this->getTemplate()->httpCode = $exception->getCode();
    }
}
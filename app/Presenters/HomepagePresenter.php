<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;

final class HomepagePresenter extends BasePresenter
{
    public function renderDefault(): void
    {
        // Zde můžeš předat nějaká data do šablony, např.:
        // $this->template->anyVariable = 'Hello World from HomepagePresenter';
    }
}
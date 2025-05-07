<?php

declare(strict_types=1);

namespace App\AdminModule\Presenters;

class HomepagePresenter extends AdminBasePresenter
{
    public function renderDefault(): void
    {
        $this->template->message = 'Vítejte v administraci!';
    }
}
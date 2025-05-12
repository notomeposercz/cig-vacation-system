<?php

declare(strict_types=1);

namespace App\AdminModule\Presenters;

use App\Presenters\BasePresenter;
use Nette\Security\User;

abstract class AdminBasePresenter extends BasePresenter
{
    /** @persistent */
    public string $backlink = '';

    public function startup(): void
    {
        parent::startup();

        if (!$this->getUser()->isLoggedIn()) {
            $this->redirect('Login:default', ['backlink' => $this->storeRequest()]);
        }

        if (!$this->getUser()->isInRole('admin')) {
    $this->flashMessage('Přístup do administrace je povolen pouze administrátorům.', 'danger');
    $this->redirect('Dashboard:default');
}
    }
}
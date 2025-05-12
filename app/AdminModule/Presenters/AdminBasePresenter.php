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
            // Explicitní správné přesměrování mimo Admin modul
            $this->flashMessage('Pro vstup do administrace se musíte přihlásit.', 'warning');
            $this->redirectUrl($this->link(':Login:default', ['backlink' => $this->storeRequest()]));
        }

        if (!$this->getUser()->isInRole('admin')) {
            $this->flashMessage('Přístup do administrace je povolen pouze administrátorům.', 'danger');
            $this->redirectUrl($this->link(':Dashboard:default'));
        }
    }
    
    //* Akce pro odhlášení uživatele z administrace.
 
public function handleLogout(): void
{
    // Nejprve nastavíme flash zprávu
    $this->getPresenter()->flashMessage('Byli jste úspěšně odhlášeni.', 'success');
    
    // Poté se odhlásíme
    $this->getUser()->logout(true);
    
    // A nakonec přesměrujeme na přihlašovací stránku
    $this->getPresenter()->redirect(':Login:default');
}
}
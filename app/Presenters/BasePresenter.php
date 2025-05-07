<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;

/**
 * Základní presenter pro všechny presentery aplikace, které vyžadují přihlášení.
 */
abstract class BasePresenter extends Nette\Application\UI\Presenter
{
    protected function startup(): void
    {
        parent::startup();
        if (!$this->getUser()->isLoggedIn()) {
            // Pokud je aktuální presenter jiný než Login a nejsme v AdminModule, přesměrujeme na Login
            if ($this->getName() !== 'Login' && strpos($this->getName(), 'AdminModule:') === false && !$this instanceof ErrorPresenter && !$this instanceof Error4xxPresenter) {
                $this->flashMessage('Pro vstup do této sekce se musíte přihlásit.', 'warning');
                $this->redirect('Login:default', ['backlink' => $this->storeRequest()]);
            }
        } else {
            // Pokud je uživatel přihlášený a jsme na úvodní stránce (což je pravděpodobně to, co způsobuje smyčku)
            if ($this->getName() === 'Homepage' && $this->getAction() === 'default' && strpos($this->getPresenterName(), 'AdminModule') === false) {
                $this->redirect('Dashboard:default');
            }
        }
        // Zde můžeš přidat další logiku společnou pro přihlášené uživatele,
        // např. předání informací o uživateli do šablony:
        // if ($this->getUser()->isLoggedIn()) {
        //     $this->template->currentUser = $this->getUser()->getIdentity();
        // }
    }

    /**
     * Pohodlná metoda pro odhlášení odkudkoliv.
     */
    public function handleLogout(): void
{
    $this->getUser()->logout(true); // true smaže identitu okamžitě
    $this->flashMessage('Byli jste úspěšně odhlášeni.', 'success');
    $this->redirect('Login:default');
}
}
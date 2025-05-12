<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;
use Nette\Application\UI\Form;
use Nette\Security\Passwords; // Přidáme toto
use Tracy\Debugger;          // Přidáme toto

final class LoginPresenter extends Nette\Application\UI\Presenter
{
    /**
     * Metoda volaná před vykreslením jakékoliv šablony v tomto presenteru.
     * Pokud je uživatel již přihlášen, přesměrujeme ho na Dashboard.
     */
    public function startup(): void
    {
        parent::startup();
        
            // === ZAČÁTEK DOČASNÉHO KÓDU PRO GENEROVÁNÍ HASHE ===
    //$passwordsService = new Passwords();
    //$plainPassword = 'password';
    //$newHash = $passwordsService->hash($plainPassword);

    //Debugger::barDump($plainPassword, 'Heslo pro nový hash');
    //Debugger::barDump($newHash, 'NOVĚ VYGENEROVANÝ HASH');
    //die('Hash vygenerován (viz Tracy Bar). Můžeš teď tento die; odstranit a kód pro generování také.');
    // === KONEC DOČASNÉHO KÓDU ===

    // Původní kód metody startup()
    if ($this->getUser()->isLoggedIn()) {
        $this->redirect('Dashboard:default');
        }
    }
    
    /**
     * Vytvoří komponentu přihlašovacího formuláře.
     */
    protected function createComponentLoginForm(): Form
    {
        $form = new Form;
        $form->addText('username', 'E-mail:')
            ->setRequired('Prosím, zadejte svůj e-mail.')
            ->addRule(Form::EMAIL, 'Prosím, zadejte platný e-mail.');

        $form->addPassword('password', 'Heslo:')
            ->setRequired('Prosím, zadejte své heslo.');

        $form->addSubmit('send', 'Přihlásit se');

        $form->onSuccess[] = [$this, 'loginFormSucceeded'];
        return $form;
    }

    /**
     * Zpracuje úspěšné odeslání přihlašovacího formuláře.
     */
    public function loginFormSucceeded(Form $form, \stdClass $values): void
    {
    // Získáme hodnotu parametru 'backlink'
    $backlink = $this->getParameter('backlink');

    try {
        $this->getUser()->login($values->username, $values->password);

        // $this->getUser()->setExpiration(...); // Volitelné

        // Pokud máme platný backlink (není null a je to string), pokusíme se obnovit původní požadavek
        if (is_string($backlink) && $backlink !== '') {
            $this->restoreRequest($backlink); // Předáme klíč
        }
        // Pokud backlink není, nebo restoreRequest selže (což by nemělo, pokud je klíč platný),
        // přesměrujeme na výchozí stránku po přihlášení.
        // Toto redirect se provede i pokud restoreRequest() neprovede vlastní přesměrování.
        $this->redirect('Dashboard:default');

    } catch (Nette\Security\AuthenticationException $e) {
        $form->addError($e->getMessage());
        }
    }

    /**
     * Akce pro odhlášení uživatele.
     */
    public function actionLogout(): void
    {
        $this->getUser()->logout();
        $this->flashMessage('Byli jste úspěšně odhlášeni.', 'success');
        $this->redirect('Login:default'); // Přesměrujeme zpět na přihlašovací stránku
    }
}
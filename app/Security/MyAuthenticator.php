<?php

declare(strict_types=1);

namespace App\Security; // Jmenný prostor pro třídy související s bezpečností

use Nette;
use Nette\Security\Authenticator; // Rozhraní, které implementujeme
use Nette\Security\IIdentity;     // Rozhraní pro identitu přihlášeného uživatele
use Nette\Security\Passwords;     // Pomocná třída pro práci s hesly
use Nette\Database\Explorer;      // Pro přístup k databázi

final class MyAuthenticator implements Authenticator
{
    private Passwords $passwordsService; // Služba pro hashování a ověřování hesel
    private Explorer $database;         // Služba pro práci s databází

    // Konstruktor, kam Nette automaticky dodá (injektuje) potřebné služby
    public function __construct(
        Passwords $passwordsService,
        Explorer $database
    ) {
        $this->passwordsService = $passwordsService;
        $this->database = $database;
    }

    /**
     * Ověří přihlašovací údaje.
     * @throws Nette\Security\AuthenticationException Pokud ověření selže.
     */
    public function authenticate(string $username, string $password): IIdentity
    {
    
     // DOČASNÉ LADĚNÍ - PŘIDÁNO ZPĚTNÉ LOMÍTKO PŘED Tracy\Debugger
    //\Tracy\Debugger::barDump($username, 'Username from form');
    //\Tracy\Debugger::barDump($password, 'Password from form (RAW - REMOVE THIS!)');
    //\Tracy\Debugger::log("Attempting login for: $username", 'auth'); // Můžeš specifikovat soubor: 'auth.log'
    // Konec dočasného ladění
    
    
    
    
        // V naší databázi je 'username' ve skutečnosti sloupec 'email'
        $userRow = $this->database->table('users')
            ->where('email', $username)
            ->fetch();

        if (!$userRow) {
            // Uživatel s daným e-mailem nebyl nalezen
            throw new Nette\Security\AuthenticationException('Uživatel nenalezen.', self::IDENTITY_NOT_FOUND);
        }
        
        
        // DOČASNÉ LADĚNÍ - PŘIDÁNO ZPĚTNÉ LOMÍTKO PŘED Tracy\Debugger
    //\Tracy\Debugger::barDump($userRow->password_hash, 'Hash from DB');
    $isVerified = $this->passwordsService->verify($password, $userRow->password_hash);
    //\Tracy\Debugger::barDump($isVerified, 'Password verified result');
    // Konec dočasného ladění
        

        // Ověření hashe hesla
        // Tvá databáze používá bcrypt ($2b$...), což Nette Passwords podporuje.
        if (!$this->passwordsService->verify($password, $userRow->password_hash)) {
            // Heslo nesouhlasí
            throw new Nette\Security\AuthenticationException('Nesprávné heslo.', self::INVALID_CREDENTIAL);
        }

        // Kontrola, zda heslo nepotřebuje přehashovat (pokud bys v budoucnu změnil algoritmus)
        if ($this->passwordsService->needsRehash($userRow->password_hash)) {
            $userRow->update(['password_hash' => $this->passwordsService->hash($password)]);
        }

        // Připravíme data pro identitu uživatele
        // Odebereme hash hesla, ten v identitě být nemusí (a neměl by)
        $userData = $userRow->toArray();
        unset($userData['password_hash']);

        // Vrátíme Nette\Security\SimpleIdentity
        // První parametr je ID uživatele (může být INT nebo STRING, tvé je STRING)
        // Druhý parametr je pole rolí (může být i jedna role jako string)
        // Třetí parametr jsou všechna ostatní data o uživateli, která chceme mít v identitě dostupná
        return new Nette\Security\SimpleIdentity(
            $userRow->id,         // Unikátní ID uživatele (VARCHAR(36) z tvé DB)
            $userRow->role,       // Role uživatele (např. 'admin', 'manager', 'employee')
            $userData             // Pole s dalšími daty (email, first_name, last_name, department_id, atd.)
        );
    }
}
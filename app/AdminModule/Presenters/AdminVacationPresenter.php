<?php

declare(strict_types=1);

namespace App\AdminModule\Presenters;

use Nette\Database\Explorer;
use Nette\Security\User;
use Tracy\Debugger;

/**
 * Presenter pro správu žádostí o dovolenou v administračním rozhraní.
 */
class AdminVacationPresenter extends AdminBasePresenter
{
    /** @var Explorer Databázový explorer pro přístup k datům */
    private Explorer $database;
    
    /**
     * Konstruktor s dependency injection.
     */
    public function __construct(Explorer $database)
    {
        parent::__construct();
        $this->database = $database;
    }

    /**
     * Výchozí akce pro zobrazení přehledu žádostí.
     */
    public function renderDefault(): void
    {
        // Získání všech žádostí o dovolenou
        $this->template->requests = $this->database->table('vacation_requests')
            ->order('created_at DESC');
            
        // Předání aktuálního roku do šablony pro filtrování
        $this->template->currentYear = (int)date('Y');
    }
    
    /**
     * Akcept žádosti o dovolenou.
     */
    public function handleApprove($id): void
{
    try {
        if (!$id) {
            $this->flashMessage('Nebyla specifikována žádost ke schválení.', 'error');
            $this->redirect('this');
            return;
        }

        // Načtení žádosti o dovolenou
        $request = $this->database->table('vacation_requests')->get($id);
        if (!$request) {
            $this->flashMessage('Požadovaná žádost nebyla nalezena.', 'error');
            $this->redirect('this');
            return;
        }

        // Získání textového ID aktuálního uživatele (např. 'USER_ADMIN_001')
        $currentUserTextId = $this->getUser()->getId(); // Přímo textové ID

        if ($request->status !== 'pending') {
            $this->flashMessage('Žádost již byla zpracována (stav: ' . $request->status . ').', 'warning');
            $this->redirect('this');
            return;
        }

        // Zahájení transakce
        $this->database->beginTransaction();

        // Aktualizace žádosti o dovolenou
        $request->update([
            'status' => 'approved',
            'approved_at' => new \DateTime(),
            'approved_by' => $currentUserTextId, // Přímo textové ID
        ]);

        // Potvrzení transakce
        $this->database->commit();
        $this->flashMessage('Žádost byla úspěšně schválena.', 'success');
    } catch (\Exception $e) {
        // Vrácení transakce, pokud existuje
        if ($this->database->getConnection()->getPdo()->inTransaction()) {
            $this->database->rollBack();
        }

        // Záznam chyby a zobrazení uživateli
        \Tracy\Debugger::log($e, \Tracy\Debugger::EXCEPTION);
        $this->flashMessage('Při schvalování žádosti došlo k chybě: ' . $e->getMessage(), 'error');
    }

    // Přesměrování
    $this->redirect('this');
}

public function handleDelete($id): void
{
    try {
        $event = $this->database->table('vacation_requests')->get($id);
        if (!$event) {
            $this->flashMessage('Událost nebyla nalezena.', 'error');
            $this->redirect('this');
            return;
        }

        $event->delete();
        $this->flashMessage('Událost úspěšně smazána.', 'success');
        $this->redirect('this');
    } catch (\Exception $e) {
        $this->flashMessage('Chyba při mazání události.', 'error');
    }
}

public function handleBulkDelete(array $ids): void
{
    \Tracy\Debugger::barDump($ids, 'IDs received for bulk delete');

    if (empty($ids)) {
        $this->flashMessage('Nebyla vybrána žádná událost k smazání.', 'error');
        $this->redirect('this');
        return;
    }

    try {
        $deletedCount = $this->database->table('vacation_requests')
            ->where('id IN ?', $ids)
            ->delete();

        \Tracy\Debugger::barDump($deletedCount, 'Number of deleted records');

        if ($deletedCount > 0) {
            $this->flashMessage('Vybrané události byly úspěšně smazány.', 'success');
        } else {
            $this->flashMessage('Žádné z vybraných událostí nebyly nalezeny.', 'error');
        }
    } catch (\Exception $e) {
        \Tracy\Debugger::log($e, \Tracy\ILogger::ERROR);
        $this->flashMessage('Chyba při mazání vybraných událostí.', 'error');
    }

    $this->redirect('this');
}

// Pomocná metoda pro extrakci ID
private function extractNumericId($stringId): ?string 
{
    // Vraťte kompletní ID, protože v databázi jsou uloženy textové ID
    return $stringId;
    // Metoda nyní vždy vrací původní ID
}

// Totožné úpravy proveďte v metodě handleReject()
public function handleReject($id): void
{
    try {
        if (!$id) {
            $this->flashMessage('Nebyla specifikována žádost k zamítnutí.', 'error');
            $this->redirect('this');
            return;
        }

        // Načtení žádosti o dovolenou
        $request = $this->database->table('vacation_requests')->get($id);
        if (!$request) {
            $this->flashMessage('Požadovaná žádost nebyla nalezena.', 'error');
            $this->redirect('this');
            return;
        }

        // Kontrola stavu žádosti
        if ($request->status !== 'pending') {
            $this->flashMessage('Žádost již byla zpracována (stav: ' . $request->status . ').', 'warning');
            $this->redirect('this');
            return;
        }

        // Získání textového ID aktuálního uživatele (např. 'USER_ADMIN_001')
        $currentUserTextId = $this->getUser()->getId();

        // Zahájení transakce
        $this->database->beginTransaction();

        // Aktualizace žádosti o dovolenou
        $request->update([
            'status' => 'rejected',
            'approved_at' => new \DateTime(), // Zaznamenání času zamítnutí
            'approved_by' => $currentUserTextId, // Textové ID uživatele, který zamítl žádost
        ]);

        // Potvrzení transakce
        $this->database->commit();
        $this->flashMessage('Žádost byla úspěšně zamítnuta.', 'success');
    } catch (\Exception $e) {
        // Vrácení transakce, pokud existuje
        if ($this->database->getConnection()->getPdo()->inTransaction()) {
            $this->database->rollBack();
        }

        // Záznam chyby a zobrazení uživateli
        \Tracy\Debugger::log($e, \Tracy\Debugger::EXCEPTION);
        $this->flashMessage('Při zamítnutí žádosti došlo k chybě: ' . $e->getMessage(), 'error');
    }

    // Přesměrování
    $this->redirect('this');
}
}
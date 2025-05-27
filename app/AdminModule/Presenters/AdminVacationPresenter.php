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

    /**
     * NOVÁ METODA: Smazání žádosti o dovolenou
     */
    public function handleDelete($id): void
    {
        try {
            if (!$id) {
                $this->flashMessage('Nebyla specifikována žádost ke smazání.', 'error');
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

            // Uložení údajů pro zprávu před smazáním
            $userName = $request->user ? 
                ($request->user->first_name . ' ' . $request->user->last_name) : 
                'Neznámý uživatel';
            $startDate = $request->start_date instanceof \DateTime ? 
                $request->start_date->format('j.n.Y') : $request->start_date;
            $endDate = $request->end_date instanceof \DateTime ? 
                $request->end_date->format('j.n.Y') : $request->end_date;

            // Zahájení transakce
            $this->database->beginTransaction();

            // Smazání souvisejících záznamů (pokud existují)
            $this->database->table('vacation_approvals')
                ->where('vacation_id', $id)
                ->delete();

            // Smazání samotné žádosti
            $request->delete();

            // Potvrzení transakce
            $this->database->commit();
            
            $this->flashMessage(
                "Žádost uživatele {$userName} ({$startDate} - {$endDate}) byla úspěšně smazána.", 
                'success'
            );
            
        } catch (\Exception $e) {
            // Vrácení transakce, pokud existuje
            if ($this->database->getConnection()->getPdo()->inTransaction()) {
                $this->database->rollBack();
            }

            // Záznam chyby a zobrazení uživateli
            \Tracy\Debugger::log($e, \Tracy\Debugger::EXCEPTION);
            $this->flashMessage('Při mazání žádosti došlo k chybě: ' . $e->getMessage(), 'error');
        }

        // Přesměrování
        $this->redirect('this');
    }

    /**
     * NOVÁ METODA: Hromadné smazání vybraných žádostí
     */
    public function handleBulkDelete(): void
    {
        $httpRequest = $this->getHttpRequest();
        $selectedIds = $httpRequest->getPost('selected_requests');

        if (!$selectedIds || !is_array($selectedIds)) {
            $this->flashMessage('Nebyla vybrána žádná žádost ke smazání.', 'warning');
            $this->redirect('this');
            return;
        }

        try {
            $deletedCount = 0;
            
            // Zahájení transakce
            $this->database->beginTransaction();

            foreach ($selectedIds as $id) {
                $request = $this->database->table('vacation_requests')->get($id);
                if ($request) {
                    // Smazání souvisejících záznamů
                    $this->database->table('vacation_approvals')
                        ->where('vacation_id', $id)
                        ->delete();
                    
                    // Smazání žádosti
                    $request->delete();
                    $deletedCount++;
                }
            }

            // Potvrzení transakce
            $this->database->commit();
            
            $this->flashMessage(
                "Bylo úspěšně smazáno {$deletedCount} žádostí.", 
                'success'
            );
            
        } catch (\Exception $e) {
            // Vrácení transakce, pokud existuje
            if ($this->database->getConnection()->getPdo()->inTransaction()) {
                $this->database->rollBack();
            }

            \Tracy\Debugger::log($e, \Tracy\Debugger::EXCEPTION);
            $this->flashMessage('Při hromadném mazání došlo k chybě: ' . $e->getMessage(), 'error');
        }

        $this->redirect('this');
    }
}
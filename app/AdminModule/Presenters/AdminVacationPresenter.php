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

        $request = $this->database->table('vacation_requests')->get($id);
        
        if (!$request) {
            $this->flashMessage('Požadovaná žádost nebyla nalezena.', 'error');
            $this->redirect('this');
            return;
        }
        
        // Bezpečné získání numerického ID
        $currentUserId = $this->getUser()->getId();
        $numericUserId = is_numeric($currentUserId) 
            ? (int)$currentUserId 
            : $this->extractNumericId($currentUserId);
        
        if (!$numericUserId) {
            throw new \Exception('Nepodařilo se určit ID uživatele.');
        }
        
        if ($request->status !== 'pending') {
            $this->flashMessage('Žádost již byla zpracována (stav: ' . $request->status . ').', 'warning');
            $this->redirect('this');
            return;
        }
        
        $this->database->beginTransaction();
        
        $request->update([
            'status' => 'approved',
            'approved_at' => new \DateTime(),
            'approved_by' => $numericUserId, // Použití numerického ID
        ]);
        
        $this->database->commit();
        $this->flashMessage('Žádost byla úspěšně schválena.', 'success');
        
    } catch (\Exception $e) {
        $this->database->rollBack();
        \Tracy\Debugger::log($e, \Tracy\Debugger::EXCEPTION);
        $this->flashMessage('Při schvalování žádosti došlo k chybě: ' . $e->getMessage(), 'error');
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

        $request = $this->database->table('vacation_requests')->get($id);
        
        if (!$request) {
            $this->flashMessage('Požadovaná žádost nebyla nalezena.', 'error');
            $this->redirect('this');
            return;
        }
        
        // Bezpečné získání numerického ID
        $currentUserId = $this->getUser()->getId();
        $numericUserId = is_numeric($currentUserId) 
            ? (int)$currentUserId 
            : $this->extractNumericId($currentUserId);
        
        if (!$numericUserId) {
            throw new \Exception('Nepodařilo se určit ID uživatele.');
        }
        
        if ($request->status !== 'pending') {
            $this->flashMessage('Žádost již byla zpracována (stav: ' . $request->status . ').', 'warning');
            $this->redirect('this');
            return;
        }
        
        $this->database->beginTransaction();
        
        $request->update([
            'status' => 'rejected',
            'rejected_at' => new \DateTime(),
            'rejected_by' => $numericUserId, // Použití numerického ID
        ]);
        
        $this->database->commit();
        $this->flashMessage('Žádost byla zamítnuta.', 'warning');
        
    } catch (\Exception $e) {
        $this->database->rollBack();
        \Tracy\Debugger::log($e, \Tracy\Debugger::EXCEPTION);
        $this->flashMessage('Při zamítání žádosti došlo k chybě: ' . $e->getMessage(), 'error');
    }
    
    $this->redirect('this');
}
}
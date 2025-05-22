<?php
declare(strict_types=1);

namespace App\AdminModule\Presenters;

use Nette\Database\Explorer;
use Nette\Application\UI\Form;
use Nette\Utils\ArrayHash;

class UsersPresenter extends AdminBasePresenter
{
    private const DEFAULT_VACATION_DAYS = 20;
    private const DEFAULT_CARRIED_DAYS = 0;
    private const MAX_TOTAL_DAYS = 100;
    private const MAX_CARRIED_DAYS = 50;

    private Explorer $database;

    public function __construct(Explorer $database)
    {
        parent::__construct();
        $this->database = $database;
    }

    public function renderDefault(): void
{
    // Kontrola, zda byl právě aktualizován uživatel
    $updatedUser = $this->getParameter('userUpdated');
    $totalDays = $this->getParameter('totalDays');
    $carriedDays = $this->getParameter('carriedDays');
    
    if ($updatedUser !== null) {
        // Odstraníme případné uvozovky ze jména
        $updatedUser = str_replace(['"', '"', '"'], '', $updatedUser);
        
        $message = "Nárok na dovolenou pro uživatele $updatedUser byl upraven na $totalDays dní";
        if ((float)$carriedDays > 0) {
            $message .= " (+ $carriedDays dní z minulého roku)";
        }
        $this->flashMessage($message, 'success');
        
        // Přesměrování na stejnou stránku bez parametrů, aby se nezobrazila duplicitní zpráva při refreshi
        $this->redirect('this');
        return; // Důležité - ukončíme metodu zde, aby se nepokračovalo dále
    }
    
    $currentYear = (int)date('Y');
    
    $this->template->users = $this->database->table('users')
        ->order('last_name ASC');
    
    $this->template->currentYear = $currentYear;
}
    
    protected function createComponentVacationSettingsForm(): Form
{
    $form = new Form();

    // Přejmenovat pole na 'user_id' místo možného jiného názvu
    $form->addHidden('user_id')
        ->setRequired('Uživatel musí být identifikován');

    $form->addHidden('year')
        ->setRequired('Rok musí být uveden')
        ->setDefaultValue(date('Y'));

    $form->addText('total_days', 'Nárok na dovolenou (dny):')
        ->setRequired('Zadejte počet dní dovolené')
        ->addRule($form::FLOAT, 'Počet dní musí být číslo')
        ->addRule($form::RANGE, "Počet dní musí být mezi 0 a {self::MAX_TOTAL_DAYS}", [0, self::MAX_TOTAL_DAYS]);

    $form->addText('carried_days', 'Převedeno z minulého roku (dny):')
        ->setRequired('Zadejte počet převedených dní')
        ->setDefaultValue(self::DEFAULT_CARRIED_DAYS)
        ->addRule($form::FLOAT, 'Počet dní musí být číslo')
        ->addRule($form::RANGE, "Počet dní musí být mezi 0 a {self::MAX_CARRIED_DAYS}", [0, self::MAX_CARRIED_DAYS]);

    $form->addSubmit('save', 'Uložit nastavení');
    $form->onSuccess[] = [$this, 'vacationSettingsFormSucceeded'];

    return $form;
}
    
    public function vacationSettingsFormSucceeded(Form $form, ArrayHash $values): void
    {
        // Přidejte tento řádek pro ladění
        \Tracy\Debugger::log("Přijaté user_id: {$values->user_id}", 'user-debug');
        
        try {
            $this->processVacationSettings($values);
            $this->flashMessage('Nastavení dovolené bylo úspěšně uloženo.', 'success');
        } catch (\Exception $e) {
            $this->flashMessage('Při ukládání nastavení došlo k chybě: ' . $e->getMessage(), 'error');
        }
        
        $this->redirect('this');
    }

    private function processVacationSettings(ArrayHash $values): void
{
    // Zahájení transakce
    $this->database->beginTransaction();
    try {
        $existingSettings = $this->database->table('vacation_settings')
            ->where('user_id', $values->user_id)
            ->where('year', $values->year)
            ->fetch();
                
        $settingsData = [
            'total_days' => $values->total_days,
            'carried_days' => $values->carried_days,
        ];

        if ($existingSettings) {
            $existingSettings->update($settingsData);
        } else {
            $settingsData['user_id'] = $values->user_id;
            $settingsData['year'] = $values->year;
            $this->database->table('vacation_settings')->insert($settingsData);
        }

        // Potvrzení transakce
        $this->database->commit();
    } catch (\Exception $e) {
        // Vrácení transakce v případě chyby
        $this->database->rollBack();
        throw $e;
    }
}
    
    public function handleEditSettings(): void 
{
    if (!$this->isAjax()) {
        $this->redirect('this');
        return;
    }

    // Získání ID uživatele a debugging
    $userId = $this->getHttpRequest()->getPost('userId');
    \Tracy\Debugger::log("Získané userId: '$userId'", 'ajax-log');
    
    // Důležité: odstranit případné uvozovky, které se mohly dostat do ID
    $userId = trim($userId, '"\'');
    \Tracy\Debugger::log("Očištěné userId: '$userId'", 'ajax-log');
    
    if (empty($userId)) {
        \Tracy\Debugger::log("Prázdné userId", 'ajax-error');
        $this->sendJson(['error' => 'Chybí ID uživatele']);
        return;
    }
    
    // Načtení uživatele s detailnějším logováním
    $user = $this->database->table('users')->get($userId);
    if (!$user) {
        \Tracy\Debugger::log("Uživatel s ID '$userId' nebyl nalezen v databázi", 'ajax-error');
        
        // Pro debugging vypíšeme všechna existující ID uživatelů
        $allUserIds = [];
        foreach ($this->database->table('users') as $u) {
            $allUserIds[] = $u->id;
        }
        \Tracy\Debugger::log("Existující ID uživatelů: " . implode(", ", $allUserIds), 'ajax-log');
        
        $this->sendJson(['error' => 'Uživatel nebyl nalezen']);
        return;
    }
    
    \Tracy\Debugger::log("Uživatel nalezen: {$user->first_name} {$user->last_name}", 'ajax-log');
    
    $currentYear = (int)date('Y');
    
    // Načtení nastavení dovolené
    $settings = $this->database->table('vacation_settings')
        ->where('user_id', $userId)
        ->where('year', $currentYear)
        ->fetch();
    
    // Příprava dat pro formulář
    $formData = [
        'userId' => $userId,
        'userName' => $user->first_name . ' ' . $user->last_name,
        'totalDays' => $settings ? $settings->total_days : 20,
        'carriedDays' => $settings ? $settings->carried_days : 0,
        'year' => $currentYear
    ];
    
    \Tracy\Debugger::log("Odesílaná data: " . json_encode($formData), 'ajax-log');
    
    // Odeslání dat ve formátu JSON
    $this->sendJson($formData);
}

public function handleSaveSettings(): void
{
    // Prohlížeč očekává určitý formát odpovědi, ne pouze JSON
    $this->getHttpResponse()->setContentType('application/json');
    
    try {
        // Získání dat z formuláře
        $userId = $this->getHttpRequest()->getPost('user_id');
        $userId = trim($userId, '"\'');
        $year = (int)$this->getHttpRequest()->getPost('year');
        $totalDays = (float)$this->getHttpRequest()->getPost('total_days');
        $carriedDays = (float)$this->getHttpRequest()->getPost('carried_days');
        
        \Tracy\Debugger::log("Zpracovaná data: userId='$userId', year=$year, totalDays=$totalDays, carriedDays=$carriedDays", 'ajax-log');
        
        // Kontrola existence uživatele
        $user = $this->database->table('users')->get($userId);
        if (!$user) {
            \Tracy\Debugger::log("Uživatel s ID '$userId' nebyl nalezen v databázi", 'ajax-error');
            echo json_encode(['status' => 'error', 'message' => 'Uživatel nebyl nalezen']);
            exit;
        }
        
        // Uložení dat
        $this->database->beginTransaction();
        
        $existingSettings = $this->database->table('vacation_settings')
            ->where('user_id', $userId)
            ->where('year', $year)
            ->fetch();
            
        $settingsData = [
            'total_days' => $totalDays,
            'carried_days' => $carriedDays,
        ];
        
        if ($existingSettings) {
            $existingSettings->update($settingsData);
        } else {
            $settingsData['user_id'] = $userId;
            $settingsData['year'] = $year;
            $this->database->table('vacation_settings')->insert($settingsData);
        }
        
        $this->database->commit();
        \Tracy\Debugger::log("Nastavení úspěšně uloženo", 'ajax-log');
        
        echo json_encode(['status' => 'success', 'message' => 'Nastavení bylo úspěšně uloženo']);
        exit;
        
    } catch (\Exception $e) {
        // Kontrola, zda je aktivní transakce, než se ji pokusíme vrátit zpět
        if ($this->database->getConnection()->getPdo()->inTransaction()) {
            $this->database->rollBack();
        }
        
        \Tracy\Debugger::log("Chyba při ukládání: " . $e->getMessage() . "\n" . $e->getTraceAsString(), 'ajax-error');
        echo json_encode(['status' => 'error', 'message' => 'Chyba: ' . $e->getMessage()]);
        exit;
    }
}
}
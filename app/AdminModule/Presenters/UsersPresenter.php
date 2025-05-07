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
        $currentYear = (int)date('Y');
        
        $this->template->users = $this->database->table('users')
            ->order('last_name ASC');
        
        $this->template->currentYear = $currentYear;
    }
    
    protected function createComponentVacationSettingsForm(): Form
    {
        $form = new Form();
        
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
    }
    
    public function handleEditSettings(): void 
{
    // Získání userId přímo z požadavku
    $userId = $this->getHttpRequest()->getPost('userId');

    \Tracy\Debugger::log("Přijaté userId: $userId", 'user-debug');

    // Striktní validace vstupu
    if (!$this->isAjax()) {
        $this->payload->error = true;
        $this->payload->message = 'Neplatný požadavek';
        $this->sendPayload();
        return;
    }

    // Validace formátu ID
    if (!preg_match('/^USER_[A-Z]+_\d{3}$/', $userId)) {
        \Tracy\Debugger::log("Neplatný formát ID: $userId", 'user-error');
        $this->payload->error = true;
        $this->payload->message = 'Neplatný identifikátor uživatele';
        $this->sendPayload();
        return;
    }

    // Načtení uživatele
    $user = $this->database->table('users')
        ->where('id', $userId)
        ->fetch();

    if (!$user) {
        \Tracy\Debugger::log("Uživatel nenalezen: $userId", 'user-critical');
        $this->payload->error = true;
        $this->payload->message = 'Uživatel nebyl nalezen';
        $this->sendPayload();
        return;
    }

    $currentYear = (int)date('Y');

    // Načtení nastavení dovolené
    $settings = $this->database->table('vacation_settings')
        ->where('user_id', $userId)
        ->where('year', $currentYear)
        ->fetch();
                
    $defaults = [
        'user_id' => $userId,
        'year' => $currentYear,
        'total_days' => $settings ? $settings->total_days : 20,
        'carried_days' => $settings ? $settings->carried_days : 0,
    ];
            
    $this['vacationSettingsForm']->setDefaults($defaults);
            
    $this->payload->userId = $userId;
    $this->payload->userName = $user->first_name . ' ' . $user->last_name;
    $this->payload->success = true;
            
    $this->redrawControl('settingsFormSnippet');
}}
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
        ->addRule($form::INTEGER, 'Počet dní musí být celé číslo') // Pravidlo pro celé číslo
        ->addRule($form::RANGE, 'Počet dní musí být mezi 0 a 100', [0, 100]); // Upravte rozsah podle potřeby

    $form->addText('carried_days', 'Převedeno z minulého roku (dny):')
        ->setRequired('Zadejte počet převedených dní')
        ->setDefaultValue(self::DEFAULT_CARRIED_DAYS)
        ->addRule($form::INTEGER, 'Počet dní musí být celé číslo') // Pravidlo pro celé číslo
        ->addRule($form::RANGE, 'Počet dní musí být mezi 0 a 50', [0, 50]); // Upravte rozsah podle potřeby

    $form->addSubmit('save', 'Uložit nastavení');
    $form->onSuccess[] = [$this, 'vacationSettingsFormSucceeded'];

    return $form;
}

public function vacationSettingsFormSucceeded(Form $form, ArrayHash $values): void
{
    // Logování přijatých hodnot z formuláře
    \Tracy\Debugger::log("Přijaté hodnoty formuláře: " . json_encode($values), 'form-debug');

    // Zpracování hodnot
    try {
        $this->processVacationSettings($values);
        $this->flashMessage('Nastavení dovolené bylo úspěšně uloženo.', 'success');
    } catch (\Exception $e) {
        \Tracy\Debugger::log("Chyba při zpracování nastavení: " . $e->getMessage(), 'form-error');
        $this->flashMessage('Při ukládání nastavení došlo k chybě: ' . $e->getMessage(), 'error');
    }

    $this->redirect('this');
}

    private function processVacationSettings(ArrayHash $values): void
{
    \Tracy\Debugger::log("Zpracované hodnoty: " . json_encode($values), 'db-debug');

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
        \Tracy\Debugger::log("Nastavení aktualizováno: " . json_encode($settingsData), 'db-debug');
    } else {
        $settingsData['user_id'] = $values->user_id;
        $settingsData['year'] = $values->year;
        $this->database->table('vacation_settings')->insert($settingsData);
        \Tracy\Debugger::log("Nastavení vytvořeno: " . json_encode($settingsData), 'db-debug');
    }
}
    
    public function handleEditSettings(): void 
{
    try {
        $userId = $this->getHttpRequest()->getPost('userId');
        $userId = trim($userId, '"\'');
        
        \Tracy\Debugger::log("Přijaté userId po úpravě: '$userId'", 'user-debug');

        $currentYear = (int)date('Y');
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

        $form = $this['vacationSettingsForm'];
        $form->setDefaults($defaults);

        \Tracy\Debugger::log("Výchozí hodnoty byly nastaveny: " . json_encode($defaults), 'form-debug');

        $this->payload->success = true;
        $this->redrawControl('settingsFormSnippet');
    } catch (\Exception $e) {
        \Tracy\Debugger::log("Kritická chyba: " . $e->getMessage(), 'user-error');
        $this->payload->error = true;
        $this->payload->message = "Chyba: " . $e->getMessage();
        $this->sendPayload();
    }
}}
<?php
declare(strict_types=1);

namespace App\AdminModule\Presenters;

use Nette\Application\UI\Presenter;
use Nette\Application\UI\Form;
use Nette\Utils\ArrayHash;

class UsersPresenter extends Presenter
{
    protected function createComponentVacationSettingsForm(): Form
    {
        $form = new Form();

        $form->addHidden('user_id')
            ->setRequired('Uživatel musí být identifikován');

        $form->addHidden('year')
            ->setRequired('Rok musí být uveden')
            ->setDefaultValue(date('Y'));

        $form->addText('carried_days', 'Převedeno z minulého roku (dny):')
            ->setRequired('Zadejte počet převedených dnů')
            ->setDefaultValue(self::DEFAULT_CARRIED_DAYS)
            ->addRule($form::INTEGER, 'Počet dnů musí být celé číslo')
            ->addRule($form::RANGE, 'Počet dnů musí být mezi 0 a 50', [0, 50]);

        $form->addSubmit('save', 'Uložit nastavení');
        $form->onSuccess[] = [$this, 'vacationSettingsFormSucceeded'];

        return $form;
    }

    public function vacationSettingsFormSucceeded(Form $form, ArrayHash $values): void
    {
        // Logování přijatých hodnot z formuláře
        \Tracy\Debugger::log("Přijaté hodnoty formuláře: " . json_encode($values), 'form-debug');

        // Další zpracování formuláře
        $this->flashMessage('Nastavení bylo úspěšně uloženo.', 'success');
        $this->redirect('this');
    }
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
        $updated = $existingSettings->update($settingsData);
        \Tracy\Debugger::log("Nastavení aktualizováno: " . json_encode($updated), 'db-debug');
    } else {
        $settingsData['user_id'] = $values->user_id;
        $settingsData['year'] = $values->year;
        $inserted = $this->database->table('vacation_settings')->insert($settingsData);
        \Tracy\Debugger::log("Nastavení vytvořeno: " . json_encode($inserted), 'db-debug');
    }
}
    
    public function handleEditSettings(): void
{
    try {
        $userId = $this->getHttpRequest()->getPost('userId');
        $currentYear = (int)date('Y');

        $settings = $this->database->table('vacation_settings')
            ->where('user_id', $userId)
            ->where('year', $currentYear)
            ->fetch();

        $form = $this['vacationSettingsForm'];
        $form->setDefaults([
            'user_id' => $userId,
            'year' => $currentYear,
            'total_days' => $settings ? $settings->total_days : self::DEFAULT_VACATION_DAYS,
            'carried_days' => $settings ? $settings->carried_days : self::DEFAULT_CARRIED_DAYS,
        ]);

        $this->redrawControl('settingsFormSnippet');
    } catch (\Exception $e) {
        \Tracy\Debugger::log($e, 'error');
        $this->flashMessage('Chyba při načítání formuláře.', 'error');
    }
}
}
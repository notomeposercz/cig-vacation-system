<?php
declare(strict_types=1);

namespace App\AdminModule\Presenters;

use Nette\Database\Explorer;
use Nette\Application\UI\Form;

class UsersPresenter extends AdminBasePresenter
{
    private Explorer $database;

    public function __construct(Explorer $database)
    {
        parent::__construct();
        $this->database = $database;
    }

    public function renderDefault(): void
    {
        $this->template->users = $this->database->table('users')
            ->order('last_name ASC');
        
        $currentYear = (int)date('Y');
        $this->template->currentYear = $currentYear;
    }
    
    /**
     * Formulář pro nastavení dovolené
     */
    protected function createComponentVacationSettingsForm(): Form
    {
        $form = new Form;
        
        $form->addHidden('user_id')
            ->setRequired();
            
        $form->addHidden('year')
            ->setRequired()
            ->setDefaultValue(date('Y'));
        
        $form->addText('total_days', 'Nárok na dovolenou (dny):')
            ->setRequired('Zadejte počet dní dovolené')
            ->addRule($form::FLOAT, 'Počet dní musí být číslo')
            ->addRule($form::RANGE, 'Počet dní musí být mezi 0 a 100', [0, 100]);
            
        $form->addText('carried_days', 'Převedeno z minulého roku (dny):')
            ->setRequired('Zadejte počet převedených dní')
            ->setDefaultValue(0)
            ->addRule($form::FLOAT, 'Počet dní musí být číslo')
            ->addRule($form::RANGE, 'Počet dní musí být mezi 0 a 50', [0, 50]);
            
        $form->addSubmit('save', 'Uložit nastavení');
        
        $form->onSuccess[] = [$this, 'vacationSettingsFormSucceeded'];
        
        return $form;
    }
    
    /**
     * Zpracování formuláře nastavení dovolené
     */
    public function vacationSettingsFormSucceeded(Form $form, \stdClass $values): void
    {
        try {
            // Kontrola, zda už existuje záznam pro daného uživatele a rok
            $existingSettings = $this->database->table('vacation_settings')
                ->where('user_id', $values->user_id)
                ->where('year', $values->year)
                ->fetch();
                
            if ($existingSettings) {
                // Aktualizace existujícího záznamu
                $existingSettings->update([
                    'total_days' => $values->total_days,
                    'carried_days' => $values->carried_days,
                ]);
            } else {
                // Vytvoření nového záznamu
                $this->database->table('vacation_settings')->insert([
                    'user_id' => $values->user_id,
                    'year' => $values->year,
                    'total_days' => $values->total_days,
                    'carried_days' => $values->carried_days,
                ]);
            }
            
            $this->flashMessage('Nastavení dovolené bylo úspěšně uloženo.', 'success');
        } catch (\Exception $e) {
            $this->flashMessage('Při ukládání nastavení došlo k chybě: ' . $e->getMessage(), 'error');
        }
        
        $this->redirect('this');
    }
    
    /**
     * Signál pro otevření modálního okna s nastavením
     */
    public function handleEditSettings(string $userId): void
    {
        if ($this->isAjax()) {
            $user = $this->database->table('users')->get($userId);
            $currentYear = (int)date('Y');
            
            if (!$user) {
                $this->payload->error = true;
                $this->payload->message = 'Uživatel nebyl nalezen';
                $this->sendPayload();
                return;
            }
            
            $settings = $this->database->table('vacation_settings')
                ->where('user_id', $userId)
                ->where('year', $currentYear)
                ->fetch();
                
            // Nastavení výchozích hodnot formuláře
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
        } else {
            $this->redirect('this');
        }
    }
}
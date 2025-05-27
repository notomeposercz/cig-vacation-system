<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Forms\VacationRequestFormFactory;
use App\Model\VacationCalculatorService;
use Nette;
use Nette\Application\UI\Form;
use Nette\Database\Explorer;
use Nette\Utils\DateTime;
use DateTimeImmutable;

final class VacationPresenter extends BasePresenter
{
    private VacationRequestFormFactory $formFactory;
    private Explorer $database;
    private VacationCalculatorService $vacationCalculatorService;

    public function __construct(
        VacationRequestFormFactory $formFactory,
        Explorer $database,
        VacationCalculatorService $vacationCalculatorService
    ) {
        parent::__construct();
        $this->formFactory = $formFactory;
        $this->database = $database;
        $this->vacationCalculatorService = $vacationCalculatorService;
    }

    /**
     * Vytvoří komponentu formuláře pro žádost o dovolenou.
     */
    protected function createComponentRequestForm(): Form
    {
        // Získáme předvyplněné datum z URL parametru
        $prefilledDate = $this->getParameter('date');
        
        $form = $this->formFactory->create($prefilledDate);
        $form->onSuccess[] = [$this, 'requestFormSucceeded'];
        return $form;
    }

    /**
     * Zpracuje úspěšné odeslání formuláře.
     */
    public function requestFormSucceeded(Form $form, \stdClass $values): void
    {
        $userId = $this->getUser()->getId();

        // Oprava chyby: Použití konstruktoru místo neexistující metody fromMutable
        $startDate = new \DateTimeImmutable($values->start_date);
        $endDate = new \DateTimeImmutable($values->end_date);

        $startHalfDay = $values->start_day_portion === 'PM_HALF_DAY';
        $endHalfDay = $values->end_day_portion === 'AM_HALF_DAY';

        $calculatedDurationDays = $this->vacationCalculatorService->calculateVacationDays(
            $startDate,
            $endDate,
            $startHalfDay,
            $endHalfDay
        );

        $roundedDuration = round($calculatedDurationDays, 1);

        try {
            $this->database->table('vacation_requests')->insert([
                'user_id' => $userId,
                'start_date' => $values->start_date,
                'end_date' => $values->end_date,
                'start_day_portion' => $values->start_day_portion,
                'end_day_portion' => $values->end_day_portion,
                'type' => $values->type,
                'status' => 'pending',
                'note' => $values->note,
                'calculated_duration_days' => $roundedDuration
            ]);

            // Pokud je to AJAX požadavek, vrátíme JSON odpověď
            if ($this->getHttpRequest()->isAjax()) {
                $this->sendJson([
                    'success' => true,
                    'message' => 'Vaše žádost o dovolenou byla úspěšně odeslána.'
                ]);
            } else {
                $this->flashMessage('Vaše žádost o dovolenou byla úspěšně odeslána.', 'success');
                $this->redirect('Dashboard:default');
            }

        } catch (\Exception $e) {
            // Pokud je to AJAX požadavek, vrátíme JSON chybovou odpověď
            if ($this->getHttpRequest()->isAjax()) {
                $this->sendJson([
                    'success' => false,
                    'message' => 'Při ukládání žádosti došlo k chybě. Zkuste to prosím znovu.'
                ]);
            } else {
                $form->addError('Při ukládání žádosti došlo k chybě. Zkuste to prosím znovu.');
            }
        }
    }

    /**
     * Akce pro zobrazení formuláře
     */
    public function actionNewRequest(?string $date = null): void
    {
        // Validace a předání datumu do šablony
        if ($date) {
            try {
                $selectedDate = new DateTime($date);
                $this->template->selectedDate = $selectedDate->format('j. n. Y');
                $this->template->selectedDateParam = $date;
            } catch (\Exception $e) {
                // Pokud je datum neplatné, ignorujeme ho
                $this->template->selectedDate = null;
                $this->template->selectedDateParam = null;
            }
        } else {
            $this->template->selectedDate = null;
            $this->template->selectedDateParam = null;
        }

        // Pokud je to AJAX požadavek, změníme layout
        if ($this->getHttpRequest()->isAjax()) {
            $this->setLayout(false);
        }
    }

    /**
     * Zruší vytváření žádosti a vrátí uživatele zpět.
     */
    public function handleCancel(): void
    {
        $this->redirect('Dashboard:default');
    }
}
<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Forms\VacationRequestFormFactory;
use App\Model\VacationCalculatorService; // Přidáno použití naší služby
use Nette;
use Nette\Application\UI\Form;
use Nette\Database\Explorer;
use Nette\Utils\DateTime;
use DateTimeImmutable; // Přidáno použití immutable data a času

final class VacationPresenter extends BasePresenter
{
    private VacationRequestFormFactory $formFactory;
    private Explorer $database;
    private VacationCalculatorService $vacationCalculatorService; // Přidána injektovaná služba

    public function __construct(
        VacationRequestFormFactory $formFactory,
        Explorer $database,
        VacationCalculatorService $vacationCalculatorService // Injektujeme naši službu
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
        $form = $this->formFactory->create();
        $form->onSuccess[] = [$this, 'requestFormSucceeded'];
        return $form;
    }

    /**
     * Zpracuje úspěšné odeslání formuláře.
     */
    public function requestFormSucceeded(Form $form, \stdClass $values): void
    {
        $userId = $this->getUser()->getId();
        \Tracy\Debugger::log("requestFormSucceeded: User ID = {$userId}", 'form-debug');

        // Převedeme Nette\Utils\DateTime na DateTimeImmutable pro naši službu
        $startDate = DateTimeImmutable::fromMutable($values->start_date);
        $endDate = DateTimeImmutable::fromMutable($values->end_date);
        $startHalfDay = $values->start_day_portion === 'AFTERNOON'; // Předpokládáme, že 'AFTERNOON' znamená půlden
        $endHalfDay = $values->end_day_portion === 'MORNING';   // Předpokládáme, že 'MORNING' znamená půlden na konci

        // Použijeme naši VacationCalculatorService k výpočtu délky dovolené
        $calculatedDurationDays = $this->vacationCalculatorService->calculateVacationDays(
            $startDate,
            $endDate,
            $startHalfDay,
            $endHalfDay
        );

        // Zaokrouhlení na jedno desetinné místo pro uložení do databáze
        $roundedDuration = round($calculatedDurationDays, 1);
        \Tracy\Debugger::log("requestFormSucceeded: Calculated duration = {$roundedDuration} days", 'form-debug');

        try {
            \Tracy\Debugger::log("requestFormSucceeded: Attempting database insert.", 'form-debug');
            $this->database->table('vacation_requests')->insert([
                'user_id' => $userId,
                'start_date' => $values->start_date,
                'end_date' => $values->end_date,
                'start_day_portion' => $values->start_day_portion,
                'end_day_portion' => $values->end_day_portion,
                'type' => $values->type,
                'status' => 'pending',
                'note' => $values->note,
                'calculated_duration_days' => $roundedDuration // Ukládáme přesně vypočítanou délku
            ]);
            \Tracy\Debugger::log("requestFormSucceeded: Database insert SUCCEEDED.", 'form-debug');

            $this->flashMessage('Vaše žádost o dovolenou byla úspěšně odeslána.', 'success');
            \Tracy\Debugger::log("requestFormSucceeded: Flash message set. Attempting redirect to Dashboard:default.", 'form-debug');

            $this->redirect('Dashboard:default');
            // Kód zde by se už neměl vykonat

        } catch (Nette\Application\AbortException $e) {
            // Tuto výjimku musíme znovu vyhodit, aby Nette dokončilo přesměrování
            \Tracy\Debugger::log("requestFormSucceeded: AbortException caught and re-thrown for redirect.", 'form-debug');
            throw $e;
        } catch (\Exception $e) { // Zachytáváme všechny ostatní (skutečné) chyby
            \Tracy\Debugger::log("requestFormSucceeded: GENERIC EXCEPTION CAUGHT!", 'form-debug-error');
            \Tracy\Debugger::log($e, \Tracy\ILogger::EXCEPTION);
            $form->addError('Při ukládání žádosti došlo k chybě. Zkuste to prosím znovu.');
        }
    }

    /**
     * Akce pro zobrazení formuláře (může být i renderDefault, pokud presenter dělá jen toto)
     */
    public function actionNewRequest(): void
    {
        // Můžeme předat nějaké výchozí hodnoty nebo data do šablony, pokud je potřeba
        // $this->template->someData = ...;
    }
}
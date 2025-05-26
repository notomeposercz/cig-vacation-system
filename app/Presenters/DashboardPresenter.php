<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;
use Nette\Database\Explorer;
use Nette\Utils\DateTime;
use Nette\Utils\Json;
use App\Model\VacationCalculatorService;

final class DashboardPresenter extends BasePresenter
{
    private Explorer $database;
    private VacationCalculatorService $vacationCalculatorService;

    public function __construct(Explorer $database, VacationCalculatorService $vacationCalculatorService)
    {
        parent::__construct();
        $this->database = $database;
        $this->vacationCalculatorService = $vacationCalculatorService;
    }

    /**
     * Pomocná metoda pro formátování textového popisu části dne.
     */
    private function formatDayPortion(string $portion): string
    {
        switch ($portion) {
            case 'FULL_DAY': return 'celý den';
            case 'AM_HALF_DAY': return 'dop. půlden';
            case 'PM_HALF_DAY': return 'odp. půlden';
            default: return $portion;
        }
    }

    /**
     * Přesměruje uživatele do administrace.
     */
    public function handleGoToAdmin(): void
    {
        if ($this->getUser()->isInRole('admin')) {
            $this->redirectUrl($this->link(':Admin:Homepage:default'));
        } else {
            $this->flashMessage('Pro přístup do administrace nemáte oprávnění.', 'warning');
            $this->redirect('this');
        }
    }

    public function renderDefault(): void
    {
        $userId = $this->getUser()->getId();
        $currentYear = (int)date('Y');

        // 1. Načtení žádostí o dovolenou pro aktuálního uživatele
        $myVacationRequests = $this->database->table('vacation_requests')
            ->where('user_id', $userId)
            ->order('start_date DESC');

        // 2. Načtení nastavení dovolené
        $vacationSettings = $this->database->table('vacation_settings')
            ->where('user_id', $userId)
            ->where('year', $currentYear)
            ->fetch();

        // 3. Výpočet statistik dovolené
        $daysTaken = 0.0;
        $remainingDays = null;
        $totalAllowance = 0.0;

        if ($vacationSettings) {
            $totalAllowance = (float)$vacationSettings->total_days + (float)$vacationSettings->carried_days;

            $approvedRequestsThisYear = $this->database->table('vacation_requests')
                ->where('user_id', $userId)
                ->where('status', 'approved')
                ->where('YEAR(start_date)', $currentYear);

            foreach ($approvedRequestsThisYear as $request) {
                $daysTaken += (float)$request->calculated_duration_days;
            }
            
            $remainingDays = $totalAllowance - $daysTaken;
        }

        // 4. Příprava událostí pro vlastní kalendář
        $calendarEvents = $this->getCalendarEventsForCustomCalendar();

\Tracy\Debugger::barDump($this->getCalendarEventsForCustomCalendar(), 'calendarEvents');

        // 5. Předání dat do šablony
        $this->template->message = "Vítejte na vašem dashboardu!";
        $this->template->myRequests = $myVacationRequests;
        $this->template->vacationSettings = $vacationSettings;
        $this->template->remainingDays = $remainingDays;
        $this->template->daysTaken = $daysTaken;
        $this->template->currentYear = $currentYear;
        
        // Pro vlastní kalendář - data ve formátu kompatibilním s původním FullCalendar
        $this->template->calendarEventsJson = Json::encode($calendarEvents);
        $this->template->czechHolidays = Json::encode($this->vacationCalculatorService->getCzechHolidays());
    }

    /**
     * Získání událostí kalendáře pro vlastní kalendář
     * Zachováváme kompatibilitu s původním formátem pro snadnější přechod
     */
    private function getCalendarEventsForCustomCalendar(): array
    {
        $events = [];
        $year = (int)date('Y');
        $czechHolidays = $this->vacationCalculatorService->getCzechHolidays();

        // Získání všech žádostí o dovolenou pro aktuální rok
        $vacationRequests = $this->database->table('vacation_requests')
            ->where('YEAR(start_date) = ? OR YEAR(end_date) = ?', $year, $year)
            ->fetchAll();

        foreach ($vacationRequests as $vacation) {
            try {
                // Zpracování dat
                $endDateObject = $vacation->end_date instanceof DateTime ? 
                    $vacation->end_date : new DateTime($vacation->end_date);
                
                // Pro FullCalendar kompatibilitu - konečný datum + 1 den
                $endDateForCalendar = $endDateObject->modifyClone('+1 day');
                
                $startDateObject = $vacation->start_date instanceof DateTime ? 
                    $vacation->start_date : new DateTime($vacation->start_date);
                
                $createdAtObject = $vacation->created_at instanceof DateTime ? 
                    $vacation->created_at : 
                    ($vacation->created_at ? new DateTime($vacation->created_at) : null);

                // Získání jména uživatele
                $userName = $vacation->user ? 
                    ($vacation->user->first_name . ' ' . $vacation->user->last_name) : 
                    'Neznámý uživatel';

                // Překlad typu
                $typeText = 'Dovolená';
                if ($vacation->type === 'sick_leave') {
                    $typeText = 'Nemocenská';
                } elseif ($vacation->type === 'other') {
                    $typeText = 'Jiné';
                }

                $title = $userName . ' - ' . $typeText;

                // Barvy podle stavu
                $backgroundColor = '#6c757d'; // výchozí
                $borderColor = '#545b62';
                
                if ($vacation->status === 'approved') {
                    $backgroundColor = '#28a745';
                    $borderColor = '#1e7e34';
                } elseif ($vacation->status === 'pending') {
                    $backgroundColor = '#ffc107';
                    $borderColor = '#e0a800';
                } elseif ($vacation->status === 'rejected') {
                    $backgroundColor = '#dc3545';
                    $borderColor = '#c82333';
                }

                // Vytvoření události v kompatibilním formátu
                $event = [
    'id' => $vacation->id,
    'title' => $title,
    'start' => $startDateObject->format('Y-m-d'),
    'end' => $endDateForCalendar->format('Y-m-d'),
    'backgroundColor' => $backgroundColor,
    'borderColor' => $borderColor,
    'textColor' => '#ffffff',
    'userName' => $userName,
    'type' => $vacation->type,        // ← přidej tento řádek
    'status' => $vacation->status,    // ← přidej tento řádek
    'extendedProps' => [
        'userName' => $userName,
        'type' => $typeText,
        'status' => $vacation->status,
        'startDateFull' => $startDateObject->format('j. F Y'),
        'endDateFull' => $endDateObject->format('j. F Y'),
        'startDayPortionText' => $this->formatDayPortion($vacation->start_day_portion),
        'endDayPortionText' => $this->formatDayPortion($vacation->end_day_portion),
        'duration' => $vacation->calculated_duration_days,
        'note' => $vacation->note ?: '-',
        'requestedAt' => $createdAtObject ? $createdAtObject->format('j.n.Y H:i') : '-',
    ]
];
$event['start_date'] = $event['start'];
$event['end_date'] = $event['end'];
                $events[] = $event;
                
            } catch (\Exception $ex) {
                // Logování chyby a pokračování
                \Tracy\Debugger::log(
                    "Chyba při zpracování vacation ID {$vacation->id}: " . $ex->getMessage(), 
                    \Tracy\ILogger::WARNING
                );
                continue;
            }
        }

        return $events;
    }

    /**
     * AJAX endpoint pro získání událostí pro konkrétní měsíc
     * Užitečné pro případné budoucí optimalizace
     */
    public function handleGetEventsForMonth(int $year, int $month): void
    {
        if (!$this->isAjax()) {
            $this->redirect('this');
        }

        try {
            // Získání událostí pouze pro konkrétní měsíc
            $startDate = new DateTime("$year-$month-01");
            $endDate = $startDate->modifyClone('last day of this month');
            
            $vacationRequests = $this->database->table('vacation_requests')
                ->where('start_date <= ? AND end_date >= ?', $endDate->format('Y-m-d'), $startDate->format('Y-m-d'))
                ->fetchAll();

            $events = [];
            foreach ($vacationRequests as $vacation) {
                // Zde by byla stejná logika jako v getCalendarEventsForCustomCalendar()
                // Zkráceno pro přehlednost
            }

            $this->sendJson([
                'success' => true,
                'events' => $events
            ]);

        } catch (\Exception $e) {
            $this->sendJson([
                'success' => false,
                'error' => 'Chyba při načítání událostí'
            ]);
        }
    }

    // Metoda pro odhlášení
    public function handleLogout(): void
    {
        $this->getUser()->logout(true);
        $this->flashMessage('Byli jste úspěšně odhlášeni.', 'info');
        $this->redirect('Login:default');
    }
}
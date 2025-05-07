<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;
use Nette\Database\Explorer;
use Nette\Utils\DateTime; // Pro práci s daty
use Nette\Utils\Json;   // Pro enkódování do JSONu
use App\Model\VacationCalculatorService;

final class DashboardPresenter extends BasePresenter // Dědí z BasePresenter pro zabezpečení
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
            case 'AM_HALF_DAY': return 'dop. půlden'; // Upraveno pro konzistenci s Latte
            case 'PM_HALF_DAY': return 'odp. půlden'; // Upraveno pro konzistenci s Latte
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
        // parent::renderDefault(); // Pokud by tvůj BasePresenter měl vlastní renderDefault logiku

        $userId = $this->getUser()->getId();
        $currentYear = (int)date('Y'); // Použijeme aktuální rok dynamicky

        // 1. Načtení žádostí o dovolenou pro aktuálního uživatele (pro tabulkový výpis)
        $myVacationRequests = $this->database->table('vacation_requests')
            ->where('user_id', $userId)
            ->order('start_date DESC'); // Nebo 'created_at DESC'

        // 2. Načtení nastavení dovolené pro aktuálního uživatele a aktuální rok
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

            // Spočítáme skutečně vyčerpané dny z SCHVÁLENÝCH žádostí v aktuálním roce
            $approvedRequestsThisYear = $this->database->table('vacation_requests')
                ->where('user_id', $userId)
                ->where('status', 'approved') // Jen schválené
                ->where('YEAR(start_date)', $currentYear); // Filtrujeme podle roku začátku dovolené

            foreach ($approvedRequestsThisYear as $request) {
                $daysTaken += (float)$request->calculated_duration_days;
            }
            // TODO: V budoucnu by se hodnota $daysTaken měla ideálně brát přímo z
            //       aktualizovaného sloupce `vacation_settings.days_taken_in_year`
            $remainingDays = $totalAllowance - $daysTaken;
        }

        // 4. Příprava událostí pro FullCalendar
        $calendarEvents = $this->getCalendarEvents();

        // 5. Předání všech dat do šablony
        $this->template->message = "Vítejte na vašem dashboardu!";
        $this->template->myRequests = $myVacationRequests;
        $this->template->vacationSettings = $vacationSettings;
        $this->template->remainingDays = $remainingDays;
        $this->template->daysTaken = $daysTaken; // Ujisti se, že tuto proměnnou také předáváš
        $this->template->currentYear = $currentYear;
        $this->template->calendarEventsJson = Json::encode($calendarEvents); // Toto je klíčové pro kalendář
        $this->template->czechHolidays = $this->vacationCalculatorService->getCzechHolidays(); // Předáme svátky do šablony (možná nebudeme potřebovat)
    }

    private function getCalendarEvents(): array
    {
        $events = [];
        $year = (int)date('Y');
        $month = (int)date('n');
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $czechHolidays = $this->vacationCalculatorService->getCzechHolidays();

        // Získání událostí dovolených z databáze (načítáme všechny pro zobrazení v kalendáři)
        $vacationRequests = $this->database->table('vacation_requests')
            ->where('YEAR(start_date) = ? OR YEAR(end_date) = ?', $year, $year)
            ->fetchAll();

        foreach ($vacationRequests as $vacation) {
            if ($vacation->end_date instanceof Nette\Utils\DateTime) {
                $endDateObject = $vacation->end_date;
            } else {
                try {
                    $endDateObject = new Nette\Utils\DateTime($vacation->end_date);
                } catch (\Exception $ex) {
                    \Tracy\Debugger::log("Chyba při parsování end_date pro vacation ID {$vacation->id}: " . $ex->getMessage(), \Tracy\ILogger::WARNING);
                    continue;
                }
            }
            $endDateForCalendar = $endDateObject->modifyClone('+1 day');
            $startDateObject = $vacation->start_date instanceof Nette\Utils\DateTime ? $vacation->start_date : new Nette\Utils\DateTime($vacation->start_date);
            $createdAtObject = $vacation->created_at instanceof Nette\Utils\DateTime ? $vacation->created_at : ($vacation->created_at ? new Nette\Utils\DateTime($vacation->created_at) : null);
            $userName = $vacation->user ? ($vacation->user->first_name . ' ' . $vacation->user->last_name) : 'Neznámý uživatel';
            $typeText = 'Dovolená';
            if ($vacation->type === 'sick_leave') {
                $typeText = 'Nemocenská';
            } elseif ($vacation->type === 'other') {
                $typeText = 'Jiné';
            }
            $title = $userName . ' - ' . $typeText;
            $backgroundColor = '#6c757d';
            $borderColor = '#545b62';
            if ($vacation->status === 'approved') {
                $backgroundColor = '#28a745';
                $borderColor = '#1e7e34';
            } elseif ($vacation->status === 'pending') {
                $backgroundColor = '#ffc107';
                $borderColor = '#e0a800';
            }
            $event = [
                'id' => $vacation->id,
                'title' => $title,
                'start' => $startDateObject->format('Y-m-d'),
                'end' => $endDateForCalendar->format('Y-m-d'),
                'backgroundColor' => $backgroundColor,
                'borderColor' => $borderColor,
                'textColor' => '#ffffff',
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
            $events[] = $event;
        }

        // Přidání zvýraznění státních svátků
    for ($i = 1; $i <= $daysInMonth; $i++) {
        $currentDate = sprintf('%s-%02d-%02d', $year, $month, $i);
        if (in_array($currentDate, $czechHolidays)) {
            $events[] = [
                'start' => $currentDate,
                'end' => $currentDate,
                'allDay' => true,
                'className' => 'event-holiday',
                'editable' => false,
                'display' => 'background',
            ];
        }
    }

    return $events;
}

    // Metoda pro odhlášení
    public function handleLogout(): void
    {
        $this->getUser()->logout(true);
        $this->flashMessage('Byli jste úspěšně odhlášeni.', 'info');
        $this->redirect('Login:default');
    }
}
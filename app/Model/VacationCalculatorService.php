<?php

namespace App\Model;

use DateTimeImmutable;

class VacationCalculatorService
{
    /**
     * @var array Seznam státních svátků v České republice (formát Y-m-d)
     */
    private array $czechHolidays = [
        '2025-01-01', // Den obnovy samostatného českého státu / Nový rok
        '2025-04-18', // Velký pátek
        '2025-04-21', // Velikonoční pondělí
        '2025-05-01', // Svátek práce
        '2025-05-08', // Den vítězství
        '2025-07-05', // Den slovanských věrozvěstů Cyrila a Metoděje
        '2025-07-06', // Den upálení mistra Jana Husa
        '2025-09-28', // Den české státnosti
        '2025-10-28', // Den vzniku samostatného československého státu
        '2025-11-17', // Den boje za svobodu a demokracii
        '2025-12-24', // Štědrý den
        '2025-12-25', // 1. svátek vánoční
        '2025-12-26', // 2. svátek vánoční
        // Můžeš přidat další roky podle potřeby
    ];

    /**
     * Vypočítá délku dovolené v pracovních dnech.
     *
     * @param DateTimeImmutable $startDate
     * @param DateTimeImmutable $endDate
     * @param bool $startHalfDay True, pokud začíná dovolená půldnem
     * @param bool $endHalfDay True, pokud končí dovolená půldnem
     * @return float
     */
    public function calculateVacationDays(
        DateTimeImmutable $startDate,
        DateTimeImmutable $endDate,
        bool $startHalfDay = false,
        bool $endHalfDay = false
    ): float {
        $days = 0;
        $currentDate = $startDate;

        while ($currentDate <= $endDate) {
            $dayOfWeek = $currentDate->format('N'); // 1 (pondělí) až 7 (neděle)
            $dateString = $currentDate->format('Y-m-d');

            // Přičti den, pokud je to pracovní den a není to státní svátek
            if ($dayOfWeek >= 1 && $dayOfWeek <= 5 && !in_array($dateString, $this->czechHolidays)) {
                $days++;
            }

            $currentDate = $currentDate->modify('+1 day');
        }

        // Odečti půl dne, pokud dovolená začíná nebo končí půldnem
        if ($startHalfDay) {
            $days -= 0.5;
        }
        if ($endHalfDay) {
            $days -= 0.5;
        }

        return max(0, $days); // Zajistíme, že výsledek nebude záporný
    }

    /**
     * Získá seznam státních svátků.
     *
     * @return array
     */
    public function getCzechHolidays(): array
    {
        return $this->czechHolidays;
    }
}
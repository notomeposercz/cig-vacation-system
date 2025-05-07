<?php

declare(strict_types=1);

namespace App\Forms;

use Nette;
use Nette\Application\UI\Form;
use Nette\Utils\DateTime;

final class VacationRequestFormFactory
{
    use Nette\SmartObject;

    public function create(): Form
    {
        $form = new Form;

        $form->addText('start_date', 'Datum od:')
            ->setHtmlType('date')
            ->setRequired('Prosím, zadejte datum začátku dovolené.')
            // ->addRule(Form::VALID, 'Datum od není platné.') // TOTO ODSTRANÍME
            ->setDefaultValue((new DateTime())->format('Y-m-d'));

        $dayPortionItems = [
            'FULL_DAY' => 'Celý den',
            'AM_HALF_DAY' => 'Dopolední půlden (do 12:00)',
            'PM_HALF_DAY' => 'Odpolední půlden (od 12:00)'
        ];

        $form->addSelect('start_day_portion', 'První den:', $dayPortionItems)
            ->setDefaultValue('FULL_DAY')
            ->setRequired();

        $form->addText('end_date', 'Datum do:')
            ->setHtmlType('date')
            ->setRequired('Prosím, zadejte datum konce dovolené.')
            // ->addRule(Form::VALID, 'Datum do není platné.') // TOTO ODSTRANÍME
            ->addRule(function (Nette\Forms\Controls\TextInput $input) { // Upravena anonymní funkce pro validaci
                $form = $input->getForm(); // Získáme formulář
                if (!isset($form['start_date'])) { // Ochrana, pokud by start_date neexistoval
                    return true;
                }
                $startDateInput = $form['start_date'];
                if ($startDateInput->isFilled() && $input->isFilled()) { // Validujeme, jen pokud jsou obě pole vyplněna
                    try {
                        // Pokusíme se vytvořit DateTime objekty pro porovnání
                        $startDate = DateTime::from($startDateInput->getValue());
                        $endDate = DateTime::from($input->getValue());
                        return $endDate >= $startDate; // Koncové datum musí být stejné nebo pozdější než počáteční
                    } catch (\Exception $e) {
                        return false; // Pokud dojde k chybě při parsování data, považujeme za neplatné
                    }
                }
                return true; // Pokud jedno z polí není vyplněno, tuto validaci přeskočíme (řeší to setRequired)
            }, 'Datum do nesmí být před Datem od nebo neplatný formát.')
            ->setDefaultValue((new DateTime())->format('Y-m-d'));

        $form->addSelect('end_day_portion', 'Poslední den:', $dayPortionItems)
            ->setDefaultValue('FULL_DAY')
            ->setRequired();

        $requestTypeItems = [
            'vacation' => 'Dovolená',
            'sick_leave' => 'Nemocenská (Sick leave)',
            'other' => 'Jiné (uveďte v poznámce)'
        ];
        $form->addSelect('type', 'Typ žádosti:', $requestTypeItems)
            ->setDefaultValue('vacation')
            ->setRequired();

        $form->addTextArea('note', 'Poznámka:')
            ->setNullable()
            ->addCondition(Form::FILLED)
                ->addRule(Form::MAX_LENGTH, 'Poznámka je příliš dlouhá.', 1000);

        $form->addSubmit('send', 'Odeslat žádost');

        return $form;
    }
}
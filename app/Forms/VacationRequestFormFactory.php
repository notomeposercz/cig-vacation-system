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
            ->addRule(function (Nette\Forms\Controls\TextInput $input) {
                $form = $input->getForm();
                if (!isset($form['start_date'])) {
                    return true;
                }
                $startDateInput = $form['start_date'];
                if ($startDateInput->isFilled() && $input->isFilled()) {
                    try {
                        $startDate = DateTime::from($startDateInput->getValue());
                        $endDate = DateTime::from($input->getValue());
                        return $endDate >= $startDate;
                    } catch (\Exception $e) {
                        return false;
                    }
                }
                return true;
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
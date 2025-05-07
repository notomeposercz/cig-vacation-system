<?php

declare(strict_types=1);

namespace App\AdminModule\Presenters;

use Nette\Database\Explorer;

class VacationPresenter extends AdminBasePresenter
{
    private Explorer $database;

    public function __construct(Explorer $database)
    {
        parent::__construct();
        $this->database = $database;
    }

    public function renderDefault(): void
    {
        $this->template->requests = $this->database->table('vacation_requests')->order('created_at DESC');
    }
}
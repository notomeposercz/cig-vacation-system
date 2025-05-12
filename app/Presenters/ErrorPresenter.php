<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;
use Tracy\ILogger;

final class ErrorPresenter implements Nette\Application\IPresenter
{
    use Nette\SmartObject;

    private ILogger $logger;

    public function __construct(ILogger $logger)
    {
        $this->logger = $logger;
    }

    public function run(Nette\Application\Request $request): Nette\Application\Response
    {
        $exception = $request->getParameter('exception');

        if ($exception instanceof Nette\Application\BadRequestException) {
            // $this->logger->log("HTTP code {$exception->getCode()}: {$exception->getMessage()} in {$exception->getFile()}:{$exception->getLine()}", 'access');
            return new Nette\Application\Responses\ForwardResponse($request->setPresenterName('Error4xx'));
        }

        $this->logger->log($exception, ILogger::EXCEPTION); // Loguje chybu
        return new Nette\Application\Responses\CallbackResponse(function (): void {
            require __DIR__ . '/templates/Error/500.latte';
        });
    }
}
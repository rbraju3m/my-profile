<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Support\SiteErrorPage;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Spatie\ResponseCache\Middlewares\CacheResponse;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: [__DIR__.'/../routes/web.php', __DIR__.'/../routes/admin.php'],
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(prepend: [
            SecurityHeaders::class,
        ], append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias(['page-cache' => CacheResponse::class]);

        // Unauthenticated admin requests go to the admin login.
        $middleware->redirectGuestsTo(fn () => route('login'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Branded error pages on the public site. The admin keeps Laravel's
        // pages, and local debugging keeps the full error screen for 500s.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();

            // An expired CSRF token on the contact form: keep what was typed and say why.
            if ($status === 419 && $request->isMethod('POST') && ! $request->is('admin', 'admin/*') && $request->hasSession()) {
                return back()->withInput()->withErrors(['form' => 'This page was open for a long time, so your session expired. Please send the message again.']);
            }

            $branded = in_array($status, [403, 404, 419, 429, 500, 503], true)
                && ! $request->is('admin', 'admin/*')
                && ! $request->expectsJson()
                && ! ($status === 500 && config('app.debug'));

            return $branded ? SiteErrorPage::render($request, $status) : $response;
        });
    })->create();

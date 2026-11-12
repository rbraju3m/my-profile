<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * The public site's error page (404, 500, ...). It is self-contained: it may be
 * rendered before any middleware ran (an unknown URL), so it relies on no
 * shared props, session or database.
 */
final class SiteErrorPage
{
    private const MESSAGES = [
        403 => ['Not allowed', 'You do not have access to this page.'],
        404 => ['Page not found', 'The page you were looking for does not exist or has moved.'],
        419 => ['Page expired', 'Your session expired. Go back, refresh the page and try again.'],
        429 => ['Too many requests', 'Please wait a moment and try again.'],
        500 => ['Something went wrong', 'An unexpected error happened on my side. Please try again in a moment.'],
        503 => ['Back soon', 'The site is down for a short update. Please check back in a few minutes.'],
    ];

    public static function render(Request $request, int $status): Response
    {
        [$title, $message] = self::MESSAGES[$status] ?? self::MESSAGES[500];
        $fullTitle = $title.' · '.config('app.name');

        // Set here too: for an unknown URL, HandleInertiaRequests never ran.
        Inertia::setRootView('site');

        return Inertia::render('Site/Error', ['status' => $status, 'title' => $title, 'message' => $message, 'meta' => ['title' => $fullTitle, 'description' => $message]])
            ->withViewData(['errorPage' => ['title' => $fullTitle, 'description' => $message]])
            ->toResponse($request)
            ->setStatusCode($status);
    }
}

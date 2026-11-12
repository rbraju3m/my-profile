<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Contact form: 5 messages an hour and 20 a day from one address.
        RateLimiter::for('contact', fn (Request $request): array => [
            Limit::perHour(5)->by('contact-h:'.$request->ip())
                ->response(fn () => back()->withErrors(['form' => 'Too many messages from this connection. Please try again later, or email me directly.'])),
            Limit::perDay(20)->by('contact-d:'.$request->ip())
                ->response(fn () => back()->withErrors(['form' => 'Too many messages from this connection today. Please email me directly.'])),
        ]);
    }
}

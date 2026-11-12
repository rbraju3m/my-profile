<?php

declare(strict_types=1);

namespace App\Providers;

use App\Actions\Fortify\UpdateUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::redirectUserForTwoFactorAuthenticationUsing(RedirectIfTwoFactorAuthenticatable::class);

        // Headless Fortify: its routes render the admin's Inertia pages.
        Fortify::loginView(fn () => Inertia::render('Admin/Auth/Login'));
        Fortify::twoFactorChallengeView(fn () => Inertia::render('Admin/Auth/TwoFactorChallenge'));
        Fortify::confirmPasswordView(fn () => Inertia::render('Admin/Auth/ConfirmPassword'));

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->string(Fortify::username())->toString()).'|'.$request->ip());

            return [
                Limit::perMinute(5)->by($throttleKey),
                // Also cap one IP across all usernames, against credential stuffing.
                Limit::perHour(30)->by('login-ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by((string) $request->session()->get('login.id'));
        });
    }
}

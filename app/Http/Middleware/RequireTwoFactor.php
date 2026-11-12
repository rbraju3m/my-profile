<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Until two-factor authentication is confirmed, the admin can only reach the
 * account page (to set it up). Switch off locally with ADMIN_REQUIRE_2FA=false.
 */
final class RequireTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (config('admin.require_two_factor') && $user instanceof User && $user->two_factor_confirmed_at === null) {
            return redirect()->route('admin.account')
                ->with('warning', 'Set up two-factor authentication before using the admin.');
        }

        return $next($request);
    }
}

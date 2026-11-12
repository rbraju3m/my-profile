<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Password and two-factor settings. The forms post to Fortify's own endpoints. */
final class AccountController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('Admin/Account', [
            'twoFactor' => [
                'enabled' => $user->two_factor_secret !== null,
                'confirmed' => $user->two_factor_confirmed_at !== null,
            ],
        ]);
    }
}

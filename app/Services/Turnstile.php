<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Throwable;

/** Verifies a Cloudflare Turnstile token server-side. */
final class Turnstile
{
    public function enabled(): bool
    {
        return filled(config('services.turnstile.site_key')) && filled(config('services.turnstile.secret_key'));
    }

    public function verify(?string $token, ?string $ip): bool
    {
        if (! $this->enabled()) {
            return true;
        }

        if ($token === null || $token === '') {
            return false;
        }

        try {
            $response = Http::asForm()->timeout(5)->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => config('services.turnstile.secret_key'),
                'response' => $token,
                'remoteip' => $ip,
            ]);
        } catch (Throwable $e) {
            report($e);

            // Fail closed: if Cloudflare cannot be reached we cannot tell people from bots.
            return false;
        }

        return $response->successful() && $response->json('success') === true;
    }
}

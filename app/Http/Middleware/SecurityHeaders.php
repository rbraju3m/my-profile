<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Content Security Policy (with a per-request nonce for scripts), plus the
 * usual hardening headers. The nonce is also put into cached pages by
 * App\Http\Cache\CspNonceReplacer, so cached HTML matches each new header.
 */
final class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = Vite::useCspNonce();

        $response = $next($request);

        $headers = $response->headers;
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $headers->set('Cross-Origin-Opener-Policy', 'same-origin');

        if ($request->isSecure()) {
            // .dev is HSTS-preloaded anyway; this keeps every subdomain on HTTPS too.
            $headers->set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        }

        // The Vite dev server injects its own scripts and websocket; only enforce CSP on built assets.
        if (! Vite::isRunningHot()) {
            $headers->set('Content-Security-Policy', implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'nonce-{$nonce}' https://challenges.cloudflare.com",
                // Inline style attributes (animation delays) and Mantine's <style> tags in the admin.
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self' data:",
                "connect-src 'self' https://challenges.cloudflare.com",
                'frame-src https://challenges.cloudflare.com',
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'",
            ]));
        }

        return $response;
    }
}

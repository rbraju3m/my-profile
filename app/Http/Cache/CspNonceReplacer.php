<?php

declare(strict_types=1);

namespace App\Http\Cache;

use Illuminate\Support\Facades\Vite;
use Spatie\ResponseCache\Replacers\Replacer;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cached pages are stored with a placeholder instead of the CSP nonce, and the
 * current request's nonce is put back when the page is served. Without this,
 * every cached page would carry a stale nonce and the browser would block its
 * scripts.
 */
final class CspNonceReplacer implements Replacer
{
    private const PLACEHOLDER = '<csp-nonce-placeholder>';

    public function prepareResponseToCache(Response $response): void
    {
        $nonce = Vite::cspNonce();
        $content = $response->getContent();

        if ($nonce !== null && $content !== false && str_contains($content, $nonce)) {
            $response->setContent(str_replace($nonce, self::PLACEHOLDER, $content));
        }
    }

    public function replaceInCachedResponse(Response $response): void
    {
        $nonce = Vite::cspNonce();
        $content = $response->getContent();

        if ($nonce !== null && $content !== false && str_contains($content, self::PLACEHOLDER)) {
            $response->setContent(str_replace(self::PLACEHOLDER, $nonce, $content));
        }
    }
}

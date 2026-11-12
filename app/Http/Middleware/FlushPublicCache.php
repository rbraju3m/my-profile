<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\PublicCache;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * After any successful admin write, clear the public page cache so the site
 * shows the change on the next visit. Doing it here rather than in model
 * observers also covers pivot syncs and media changes, which fire no model
 * events on the parent.
 */
final class FlushPublicCache
{
    public function __construct(private readonly PublicCache $cache) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->isMethodSafe() && $response->getStatusCode() < 400 && ! $request->session()->has('errors')) {
            $this->cache->flush();
        }

        return $response;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Cache;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\ResponseCache\CacheProfiles\CacheAllSuccessfulGetRequests;
use Symfony\Component\HttpFoundation\Response;

/**
 * Caches full HTML for anonymous first visits to public pages only.
 *
 * Never cached: Inertia navigations (JSON for the same URL), anything under
 * /admin, signed-in users (they may be previewing drafts), and responses that
 * carry flash data or validation errors (they are personal).
 */
final class PublicPageCacheProfile extends CacheAllSuccessfulGetRequests
{
    public function enabled(Request $request): bool
    {
        if (! parent::enabled($request)) {
            return false;
        }

        if ($request->header('X-Inertia') !== null || $request->is('admin', 'admin/*') || Auth::check()) {
            return false;
        }

        if ($request->hasSession()) {
            $session = $request->session();
            if ($session->has('errors') || $session->has('success') || $session->has('_flash.new') && $session->get('_flash.new') !== []) {
                return false;
            }
        }

        return true;
    }

    public function shouldCacheResponse(Response $response): bool
    {
        return $response->isSuccessful() && parent::shouldCacheResponse($response);
    }
}

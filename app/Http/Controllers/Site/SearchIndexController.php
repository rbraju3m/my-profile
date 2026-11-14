<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Services\PortfolioQuery;
use Illuminate\Http\JsonResponse;

/**
 * The project list the ⌘K command palette searches. Fetched only when a
 * visitor opens the palette, so pages don't carry it.
 */
final class SearchIndexController extends Controller
{
    public function __invoke(PortfolioQuery $query): JsonResponse
    {
        return response()
            ->json(['projects' => $query->searchIndex()])
            // Private: the web middleware attaches session cookies, which a shared cache must never store.
            // no-cache: an unpublished project drops out of the palette at once.
            ->header('Cache-Control', 'private, no-cache');
    }
}

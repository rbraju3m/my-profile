<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Services\PortfolioQuery;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class HomeController extends Controller
{
    public function __invoke(PortfolioQuery $query, Seo $seo): Response
    {
        $meta = $seo->page(null, null, '/', 'profile', [
            ['@context' => 'https://schema.org', '@type' => 'ProfilePage', 'mainEntity' => $seo->person()],
        ]);

        return Inertia::render('Site/Home', [...$query->home(), 'meta' => Seo::props($meta)])
            ->withViewData(['seo' => $meta]);
    }
}

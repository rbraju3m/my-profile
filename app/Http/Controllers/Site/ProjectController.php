<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\PortfolioQuery;
use App\Services\Settings;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectController extends Controller
{
    public function index(Request $request, PortfolioQuery $query, Seo $seo, Settings $settings): Response
    {
        $copy = $settings->get('sections')['projects'] ?? [];

        $meta = $seo->page(
            (string) ($copy['heading'] ?? 'Projects'),
            isset($copy['intro']) ? (string) $copy['intro'] : null,
            '/projects',
        );

        return Inertia::render('Site/Projects/Index', [
            ...$query->index(),
            'initial' => [
                'query' => mb_substr($request->string('q')->toString(), 0, 100),
                'category' => $request->filled('category') ? $request->string('category')->toString() : null,
                'status' => $request->filled('status') ? $request->string('status')->toString() : null,
                'tech' => $request->filled('tech') ? $request->string('tech')->toString() : null,
            ],
            'meta' => Seo::props($meta),
        ])
            ->withViewData(['seo' => $meta]);
    }

    public function show(Project $project, PortfolioQuery $query, Seo $seo): Response
    {
        abort_unless($project->published_at !== null && $project->published_at->isPast(), 404);

        $override = $project->seo ?? [];

        $meta = $seo->page(
            $override['title'] ?? $project->title,
            $override['description'] ?? $project->summary,
            '/projects/'.$project->slug,
            'article',
            [
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'CreativeWork',
                    'name' => $project->title,
                    'abstract' => $project->summary,
                    'creator' => $seo->person(),
                    'keywords' => $project->technologies->pluck('name')->implode(', '),
                ],
                [
                    '@context' => 'https://schema.org',
                    '@type' => 'BreadcrumbList',
                    'itemListElement' => [
                        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => url('/')],
                        ['@type' => 'ListItem', 'position' => 2, 'name' => 'Projects', 'item' => url('/projects')],
                        ['@type' => 'ListItem', 'position' => 3, 'name' => $project->title, 'item' => url('/projects/'.$project->slug)],
                    ],
                ],
            ],
            // The project's cover is its share image; otherwise the site default.
            $project->getFirstMediaUrl('cover', 'large') ?: null,
        );

        return Inertia::render('Site/Projects/Show', [...$query->show($project), 'meta' => Seo::props($meta)])
            ->withViewData(['seo' => $meta]);
    }
}

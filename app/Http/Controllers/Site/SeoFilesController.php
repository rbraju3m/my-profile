<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Response;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

/** sitemap.xml and robots.txt, generated from published content. */
final class SeoFilesController extends Controller
{
    public function sitemap(): Response
    {
        $latest = Project::query()->published()->max('updated_at');

        $sitemap = Sitemap::create()
            ->add(Url::create('/')->setPriority(1.0)->setLastModificationDate($latest ? now()->parse($latest) : now()))
            ->add(Url::create('/projects')->setPriority(0.8));

        Project::query()->published()->ordered()->each(function (Project $project) use ($sitemap): void {
            $sitemap->add(Url::create('/projects/'.$project->slug)
                ->setLastModificationDate($project->updated_at ?? now())
                ->setPriority($project->is_featured ? 0.7 : 0.5));
        });

        return response($sitemap->render(), 200, ['Content-Type' => 'text/xml; charset=UTF-8']);
    }

    public function robots(): Response
    {
        $lines = app()->isProduction()
            ? ['User-agent: *', 'Disallow: /admin', 'Disallow: /cv', '', 'Sitemap: '.route('sitemap')]
            // Never let a staging or local copy be indexed.
            : ['User-agent: *', 'Disallow: /'];

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}

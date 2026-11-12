<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Education;
use App\Models\Experience;
use App\Models\SkillCategory;
use App\Services\Settings;

/**
 * Page metadata and JSON-LD, rendered by the Blade root view.
 *
 * Kept server-side on purpose: these tags must reach crawlers even if the
 * SSR process is down, and React's <Head> only reaches them through SSR.
 */
final class Seo
{
    public function __construct(private readonly Settings $settings) {}

    /**
     * @param  list<array<string, mixed>>  $structuredData
     * @return array<string, mixed>
     */
    public function page(?string $title, ?string $description, ?string $path = null, string $type = 'website', array $structuredData = [], ?string $image = null): array
    {
        $seo = $this->settings->get('seo');
        $template = (string) ($seo['title_template'] ?? '%s');
        $fullTitle = $title === null ? (string) ($seo['default_title'] ?? config('app.name')) : sprintf($template, $title);

        return [
            'title' => $fullTitle,
            'description' => $description ?? (string) ($seo['description'] ?? ''),
            'canonical' => url($path ?? request()->path()),
            'type' => $type,
            'image' => $image ?? $this->settings->ogImageUrl(),
            'structuredData' => $structuredData,
        ];
    }

    /**
     * The subset React needs to keep <title> and the description in sync on
     * client-side navigation (the Blade view covers the first load).
     *
     * @param  array<string, mixed>  $page
     * @return array{title: string, description: string}
     */
    public static function props(array $page): array
    {
        return ['title' => (string) $page['title'], 'description' => (string) $page['description']];
    }

    /** @return array<string, mixed> */
    public function person(): array
    {
        $site = $this->settings->get('site');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Person',
            'name' => $site['name'] ?? null,
            'jobTitle' => $site['title'] ?? null,
            'image' => $this->settings->photo()['portrait'] ?? null,
            'url' => url('/'),
            'homeLocation' => isset($site['location']) ? ['@type' => 'Place', 'name' => $site['location']] : null,
            'worksFor' => ($job = Experience::query()->whereNull('ended_at')->orderBy('sort_order')->first())
                ? ['@type' => 'Organization', 'name' => $job->company]
                : null,
            'alumniOf' => ($school = Education::query()->orderBy('sort_order')->first())
                ? ['@type' => 'EducationalOrganization', 'name' => $school->institution]
                : null,
            // The first few skills of each category: the subjects, not the whole toolbox.
            'knowsAbout' => SkillCategory::query()->orderBy('sort_order')->with('technologies')->get()
                ->flatMap(fn (SkillCategory $c) => $c->technologies->where('show_in_skills', true)->take(3)->pluck('name'))
                ->values()->all(),
            'sameAs' => array_column(is_array($site['socials'] ?? null) ? $site['socials'] : [], 'url'),
        ];
    }
}

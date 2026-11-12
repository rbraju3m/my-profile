<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Admin\SettingsSchema;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Setting;
use App\Services\Settings;
use App\Support\RichText;
use App\Support\SiteLabels;
use App\Support\Themes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class SettingsController extends Controller
{
    public function edit(string $group, Settings $settings): Response
    {
        $row = Setting::query()->where('group', $group)->first();

        return Inertia::render('Admin/Settings/Edit', [
            'group' => $group,
            'value' => $settings->get($group),
            'projects' => $group === 'hero'
                ? Project::query()->ordered()->get(['slug', 'title'])->map(fn (Project $p): array => ['value' => $p->slug, 'label' => $p->title])
                : [],
            'icons' => SettingsSchema::ICONS,
            'cv' => $group === 'site' ? $this->file($row, 'cv') : null,
            'photo' => $group === 'site' ? $this->file($row, 'photo') : null,
            'ogImage' => $group === 'seo' ? $this->file($row, 'og_image') : null,
            'themes' => $group === 'appearance' ? array_map(fn (string $key, array $theme): array => ['value' => $key, 'label' => $theme['label'], 'scheme' => $theme['scheme']], array_keys(Themes::ALL), Themes::ALL) : [],
            'labelSchema' => $group === 'labels' ? SiteLabels::schema() : [],
        ]);
    }

    public function update(Request $request, string $group, Settings $settings): RedirectResponse
    {
        /** @var array<string, mixed> $value */
        $value = $request->validate(SettingsSchema::rules($group));

        // The default theme must be one visitors can actually get.
        if ($group === 'appearance' && $value['default_theme'] !== Themes::SYSTEM && ! in_array($value['default_theme'], (array) $value['themes'], true)) {
            throw ValidationException::withMessages(['default_theme' => 'The default theme must be one of the themes you offer.']);
        }

        if ($group === 'about') {
            $value['bio'] = RichText::clean(is_string($value['bio'] ?? null) ? $value['bio'] : null) ?? '';
        }

        $settings->put($group, $value);

        return back()->with('success', 'Saved.');
    }

    /** @return array{name: string, size: int, url: string, updated: string|null}|null */
    private function file(?Setting $row, string $collection): ?array
    {
        $media = $row?->getFirstMedia($collection);

        return $media === null ? null : [
            'name' => $media->file_name,
            'size' => (int) $media->size,
            'url' => $media->getUrl(),
            'updated' => $media->updated_at?->diffForHumans(),
        ];
    }
}

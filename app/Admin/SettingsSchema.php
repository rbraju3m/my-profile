<?php

declare(strict_types=1);

namespace App\Admin;

use Illuminate\Validation\Rule;

/**
 * Validation rules for each settings group edited in the admin. The public
 * site renders these values directly (including into href attributes), so
 * every link is restricted to safe schemes here.
 */
final class SettingsSchema
{
    public const GROUPS = ['site', 'hero', 'about', 'sections', 'nav', 'footer', 'seo'];

    public const SECTION_KEYS = ['skills', 'experience', 'projects', 'engineering', 'architecture', 'contact'];

    public const ICONS = ['github', 'linkedin', 'link', 'activity', 'boxes', 'cloud', 'database', 'layout', 'plug', 'scan-text', 'server', 'wrench'];

    /** Internal anchor, site path, or http(s) URL. Never javascript: or data:. */
    public const SAFE_HREF = 'regex:/^(#[A-Za-z0-9_-]*|\/[^\s]*|https?:\/\/[^\s]+)$/';

    /** @return array<string, mixed> */
    public static function rules(string $group): array
    {
        return match ($group) {
            'site' => [
                'name' => ['required', 'string', 'max:100'],
                'title' => ['required', 'string', 'max:120'],
                'role_line' => ['nullable', 'string', 'max:160'],
                'location' => ['nullable', 'string', 'max:120'],
                'email' => ['nullable', 'email', 'max:190'],
                'phone' => ['nullable', 'string', 'max:30', 'regex:/^\+?[0-9 ()-]{6,30}$/'],
                'whatsapp' => ['nullable', 'string', 'regex:/^[0-9]{6,20}$/'],
                'socials' => ['present', 'array', 'max:10'],
                'socials.*.label' => ['required', 'string', 'max:40'],
                'socials.*.url' => ['required', 'url:https,http', 'max:255'],
                'socials.*.icon' => ['nullable', Rule::in(self::ICONS)],
                'availability' => ['required', 'array'],
                'availability.enabled' => ['required', 'boolean'],
                'availability.text' => ['nullable', 'string', 'max:120'],
            ],
            'hero' => [
                'eyebrow' => ['nullable', 'string', 'max:120'],
                'headline' => ['required', 'string', 'max:160'],
                'subheading' => ['required', 'string', 'max:400'],
                'chips' => ['present', 'array', 'max:8'],
                'chips.*' => ['required', 'string', 'max:40'],
                ...self::cta('primary_cta'),
                ...self::cta('secondary_cta'),
                ...self::cta('tertiary_cta'),
                'flows' => ['present', 'array', 'max:4'],
                'flows.*.label' => ['required', 'string', 'max:60'],
                'flows.*.project' => ['required', 'string', Rule::exists('projects', 'slug')],
                'flows.*.steps' => ['required', 'array', 'min:2', 'max:5'],
                'flows.*.steps.*' => ['required', 'string', 'max:30'],
            ],
            'about' => [
                'heading' => ['required', 'string', 'max:160'],
                'bio' => ['required', 'string', 'max:20000'],
                'highlights' => ['present', 'array', 'max:6'],
                'highlights.*.value' => ['required', 'string', 'max:16'],
                'highlights.*.label' => ['required', 'string', 'max:80'],
            ],
            'sections' => collect(self::SECTION_KEYS)->flatMap(fn (string $key): array => [
                "{$key}" => ['required', 'array'],
                "{$key}.eyebrow" => ['nullable', 'string', 'max:40'],
                "{$key}.heading" => ['required', 'string', 'max:160'],
                "{$key}.intro" => ['nullable', 'string', 'max:400'],
            ])->all() + ['contact.success' => ['nullable', 'string', 'max:200']],
            'nav' => [
                'items' => ['present', 'array', 'max:10'],
                'items.*.label' => ['required', 'string', 'max:30'],
                'items.*.href' => ['required', 'string', 'max:100', self::SAFE_HREF],
            ],
            'footer' => [
                'tagline' => ['nullable', 'string', 'max:300'],
                'copyright' => ['nullable', 'string', 'max:160'],
            ],
            'seo' => [
                'title_template' => ['required', 'string', 'max:80', 'regex:/%s/'],
                'default_title' => ['required', 'string', 'max:120'],
                'description' => ['required', 'string', 'max:300'],
            ],
            default => throw new \InvalidArgumentException("Unknown settings group [{$group}]."),
        };
    }

    /** @return array<string, mixed> */
    private static function cta(string $key): array
    {
        return [
            $key => ['required', 'array'],
            "{$key}.label" => ['required', 'string', 'max:40'],
            "{$key}.href" => ['required', 'string', 'max:255', self::SAFE_HREF],
        ];
    }
}

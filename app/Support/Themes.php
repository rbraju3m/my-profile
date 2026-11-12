<?php

declare(strict_types=1);

namespace App\Support;

use App\Services\Settings;
use Throwable;

/**
 * The colour themes of the public site. The palettes themselves are design
 * tokens in resources/css/site.css (`[data-theme='…']`), each checked for WCAG
 * AA contrast; the admin chooses the default theme and which ones visitors can
 * pick (the `appearance` settings group).
 */
final class Themes
{
    /** key => label, light/dark scheme, and page background (for the browser's theme-color). */
    public const ALL = [
        'dark' => ['label' => 'Dark', 'scheme' => 'dark', 'bg' => '#0a0b0d'],
        'light' => ['label' => 'Light', 'scheme' => 'light', 'bg' => '#fafaf9'],
        'midnight' => ['label' => 'Midnight', 'scheme' => 'dark', 'bg' => '#0b1020'],
        'aurora' => ['label' => 'Aurora', 'scheme' => 'dark', 'bg' => '#0e0b16'],
        'ember' => ['label' => 'Ember', 'scheme' => 'dark', 'bg' => '#100d0a'],
        'paper' => ['label' => 'Paper', 'scheme' => 'light', 'bg' => '#f7f4ee'],
    ];

    /** Default-theme value meaning "follow the visitor's device (light or dark)". */
    public const SYSTEM = 'system';

    public function __construct(private readonly Settings $settings) {}

    /**
     * What the pre-paint script and the theme picker need. Never throws: the
     * error pages use it too, and they may render while the database is down.
     *
     * @return array{default: string, picker: bool, themes: list<array{key: string, label: string, scheme: string, bg: string}>}
     */
    public function config(): array
    {
        try {
            $appearance = $this->settings->get('appearance');
        } catch (Throwable) {
            $appearance = [];
        }

        $wanted = is_array($appearance['themes'] ?? null) ? $appearance['themes'] : array_keys(self::ALL);
        $enabled = array_values(array_filter($wanted, fn (mixed $key): bool => is_string($key) && isset(self::ALL[$key])));
        if ($enabled === []) {
            $enabled = ['dark', 'light'];
        }

        $default = is_string($appearance['default_theme'] ?? null) ? $appearance['default_theme'] : 'dark';
        if ($default !== self::SYSTEM && ! in_array($default, $enabled, true)) {
            $default = $enabled[0];
        }

        return [
            'default' => $default,
            'picker' => (bool) ($appearance['picker'] ?? true),
            'themes' => array_map(fn (string $key): array => ['key' => $key, ...self::ALL[$key]], $enabled),
        ];
    }
}

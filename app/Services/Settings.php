<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Cached read/write access to the settings groups edited in the admin.
 *
 * Every group is cached forever and forgotten when it is written, so a page
 * render never queries the settings table once the cache is warm.
 */
final class Settings
{
    private const CACHE_KEY = 'settings.all';

    /** @return array<string, mixed> */
    public function get(string $group): array
    {
        return $this->all()[$group] ?? [];
    }

    /** @return array<string, array<string, mixed>> */
    public function all(): array
    {
        /** @var array<string, array<string, mixed>> */
        return Cache::rememberForever(self::CACHE_KEY, fn (): array => Setting::query()
            ->pluck('value', 'group')
            ->all());
    }

    /** @param array<string, mixed> $value */
    public function put(string $group, array $value): void
    {
        Setting::query()->updateOrCreate(['group' => $group], ['value' => $value]);

        $this->flush();
    }

    /** The CV is a media file attached to the `site` settings row. */
    public function cv(): ?Media
    {
        return Setting::query()->where('group', 'site')->first()?->getFirstMedia('cv');
    }

    /** Default social-share image, uploaded on the `seo` settings row. */
    public function ogImageUrl(): ?string
    {
        return Cache::rememberForever(self::CACHE_KEY.'.og', fn (): ?string => Setting::query()
            ->where('group', 'seo')->first()?->getFirstMediaUrl('og_image') ?: null);
    }

    /**
     * The owner's portrait (site row), in its two sizes, or null.
     *
     * @return array{portrait: string, avatar: string}|null
     */
    public function photo(): ?array
    {
        /** @var array{portrait: string, avatar: string}|null */
        return Cache::rememberForever(self::CACHE_KEY.'.photo', function (): ?array {
            $media = Setting::query()->where('group', 'site')->first()?->getFirstMedia('photo');

            return $media === null ? null : [
                'portrait' => $media->getUrl('portrait'),
                'avatar' => $media->getUrl('avatar'),
            ];
        });
    }

    public function hasCv(): bool
    {
        return Cache::rememberForever(self::CACHE_KEY.'.has_cv', fn (): bool => $this->cv() !== null);
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
        Cache::forget(self::CACHE_KEY.'.has_cv');
        Cache::forget(self::CACHE_KEY.'.og');
        Cache::forget(self::CACHE_KEY.'.photo');
    }
}

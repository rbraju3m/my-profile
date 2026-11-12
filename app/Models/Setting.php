<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * One row per settings group (site, hero, about, seo, nav, footer, ...).
 * Read through App\Services\Settings, which caches every group.
 *
 * @property string $group
 * @property array<string, mixed> $value
 */
class Setting extends Model implements HasMedia
{
    use InteractsWithMedia;
    use LogsContentChanges;

    protected $fillable = ['group', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cv')->singleFile()->acceptsMimeTypes(['application/pdf']);
        $this->addMediaCollection('og_image')->singleFile()->acceptsMimeTypes(['image/png', 'image/jpeg', 'image/webp']);
    }
}

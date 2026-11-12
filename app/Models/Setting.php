<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;
use Spatie\Image\Enums\CropPosition;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

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
        // The owner's portrait (site row): a head-and-shoulders photo, ideally 4:5.
        $this->addMediaCollection('photo')->singleFile()->acceptsMimeTypes(['image/png', 'image/jpeg', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        // Small, so they run on upload: the site never shows a photo without its sizes.
        $this->addMediaConversion('portrait')->nonQueued()->performOnCollections('photo')->fit(Fit::Crop, 640, 800)->format('webp');
        // Square, from the top of the photo, where the face is.
        $this->addMediaConversion('avatar')->nonQueued()->performOnCollections('photo')->width(320)->crop(192, 192, CropPosition::Top)->format('webp');
    }
}

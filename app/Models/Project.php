<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * @property Carbon|null $published_at
 * @property ProjectStatus $status
 * @property ProjectCategory $category
 * @property list<string>|null $features
 * @property list<array{challenge: string, solution: string}>|null $challenges
 * @property list<array{label: string, value: string, source?: string}>|null $metrics
 * @property list<array{label: string, url: string}>|null $public_links
 * @property array{title?: string, description?: string}|null $seo
 */
class Project extends Model implements HasMedia
{
    use InteractsWithMedia;
    use LogsContentChanges;

    protected $fillable = [
        'title', 'slug', 'company', 'client', 'show_client', 'category', 'status', 'status_note',
        'period', 'role', 'authorship_note', 'summary', 'problem', 'contribution', 'features',
        'challenges', 'metrics', 'public_links', 'seo', 'is_featured', 'sort_order', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'category' => ProjectCategory::class,
            'status' => ProjectStatus::class,
            'show_client' => 'boolean',
            'is_featured' => 'boolean',
            'features' => 'array',
            'challenges' => 'array',
            'metrics' => 'array',
            'public_links' => 'array',
            'seo' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** @param Builder<Project> $query */
    public function scopePublished(Builder $query): void
    {
        $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    /** @param Builder<Project> $query */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('id');
    }

    /** @return BelongsToMany<Technology, $this> */
    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class)->withPivot('sort_order')->orderByPivot('sort_order');
    }

    /** @return BelongsToMany<Diagram, $this> */
    public function diagrams(): BelongsToMany
    {
        return $this->belongsToMany(Diagram::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')->singleFile();
        $this->addMediaCollection('gallery');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('card')->width(800)->format('webp');
        $this->addMediaConversion('large')->width(1600)->format('webp');
    }
}

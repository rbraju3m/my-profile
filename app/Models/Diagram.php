<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * An architecture diagram stored as data, so it can be edited in the admin
 * and drawn as accessible SVG by the site.
 *
 * @property list<array{id: string, label: string, sublabel?: string, type: string, col: int, row: int}> $nodes
 * @property list<array{from: string, to: string, label?: string, mode?: string}> $edges
 */
class Diagram extends Model
{
    use LogsContentChanges;

    public const NODE_TYPES = ['device', 'service', 'queue', 'storage', 'user', 'external'];

    protected $fillable = ['title', 'slug', 'description', 'nodes', 'edges', 'sort_order'];

    protected function casts(): array
    {
        return ['nodes' => 'array', 'edges' => 'array'];
    }

    /** @return BelongsToMany<Project, $this> */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class);
    }
}

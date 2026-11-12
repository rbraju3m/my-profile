<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property list<array{text: string, status: string}> $capabilities
 */
class Specialization extends Model
{
    use LogsContentChanges;

    protected $fillable = ['title', 'slug', 'icon', 'summary', 'capabilities', 'diagram_id', 'sort_order'];

    protected function casts(): array
    {
        return ['capabilities' => 'array'];
    }

    /** @return BelongsTo<Diagram, $this> */
    public function diagram(): BelongsTo
    {
        return $this->belongsTo(Diagram::class);
    }

    /** @return BelongsToMany<Project, $this> */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class);
    }
}

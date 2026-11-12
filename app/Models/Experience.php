<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $started_at
 * @property Carbon|null $ended_at
 * @property list<array{title: string, period?: string, points: list<string>}>|null $phases
 */
class Experience extends Model
{
    use LogsContentChanges;

    protected $fillable = ['company', 'title', 'location', 'started_at', 'ended_at', 'summary', 'phases', 'sort_order'];

    protected function casts(): array
    {
        return ['started_at' => 'date', 'ended_at' => 'date', 'phases' => 'array'];
    }

    /** @return BelongsToMany<Technology, $this> */
    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class);
    }
}

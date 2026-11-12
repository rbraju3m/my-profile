<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillCategory extends Model
{
    use LogsContentChanges;

    protected $fillable = ['name', 'slug', 'description', 'icon', 'sort_order'];

    /** @return HasMany<Technology, $this> */
    public function technologies(): HasMany
    {
        return $this->hasMany(Technology::class)->orderBy('sort_order');
    }
}

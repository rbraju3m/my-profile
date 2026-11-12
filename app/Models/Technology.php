<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\LogsContentChanges;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Technology extends Model
{
    use LogsContentChanges;

    protected $fillable = ['skill_category_id', 'name', 'slug', 'icon', 'show_in_skills', 'sort_order'];

    protected function casts(): array
    {
        return ['show_in_skills' => 'boolean'];
    }

    /** @return BelongsTo<SkillCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class, 'skill_category_id');
    }

    /** @return BelongsToMany<Project, $this> */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class);
    }
}

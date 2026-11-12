<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Diagram;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Project;
use App\Models\SkillCategory;
use App\Models\Specialization;
use App\Models\Technology;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Saves drag-and-drop order for any sortable list. Technologies may also move
 * between skill categories in the same request.
 */
final class ReorderController extends Controller
{
    /** @var array<string, class-string<Model>> */
    private const TYPES = [
        'projects' => Project::class,
        'experiences' => Experience::class,
        'education' => Education::class,
        'skill-categories' => SkillCategory::class,
        'technologies' => Technology::class,
        'specializations' => Specialization::class,
        'diagrams' => Diagram::class,
    ];

    public function __invoke(Request $request, string $type): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
            'category_id' => ['nullable', 'integer', 'exists:skill_categories,id'],
        ]);

        /** @var list<int> $ids */
        $ids = array_values($data['ids']);

        if ($type === 'gallery') {
            // Media from one project's gallery, in display order.
            Media::setNewOrder($ids);

            return back();
        }

        $model = self::TYPES[$type] ?? abort(404);

        DB::transaction(function () use ($model, $ids, $type, $data): void {
            foreach ($ids as $position => $id) {
                $attributes = ['sort_order' => $position];
                if ($type === 'technologies' && array_key_exists('category_id', $data)) {
                    $attributes['skill_category_id'] = $data['category_id'];
                }
                $model::query()->whereKey($id)->update($attributes);
            }
        });

        return back();
    }
}

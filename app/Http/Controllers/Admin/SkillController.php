<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Admin\SettingsSchema;
use App\Http\Controllers\Controller;
use App\Models\SkillCategory;
use App\Models\Technology;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Skill categories and the technologies inside them (technologies also drive the project filters). */
final class SkillController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Skills/Index', [
            'categories' => SkillCategory::query()->orderBy('sort_order')->get()->map(fn (SkillCategory $c): array => [
                ...$c->only(['id', 'name', 'slug', 'description', 'icon']),
                'technologies' => $c->technologies()->withCount('projects')->get()
                    ->map(fn (Technology $t): array => [...$t->only(['id', 'name', 'slug', 'show_in_skills']), 'projects' => $t->projects_count]),
            ]),
            'uncategorised' => Technology::query()->whereNull('skill_category_id')->orderBy('name')->withCount('projects')->get()
                ->map(fn (Technology $t): array => [...$t->only(['id', 'name', 'slug', 'show_in_skills']), 'projects' => $t->projects_count]),
            'icons' => SettingsSchema::ICONS,
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $data = $this->category($request);
        SkillCategory::query()->create([...$data, 'slug' => $this->uniqueSlug(SkillCategory::class, $data['name']), 'sort_order' => (int) SkillCategory::query()->max('sort_order') + 1]);

        return back()->with('success', 'Category added.');
    }

    public function updateCategory(Request $request, SkillCategory $category): RedirectResponse
    {
        $category->update($this->category($request));

        return back()->with('success', 'Saved.');
    }

    public function destroyCategory(SkillCategory $category): RedirectResponse
    {
        $category->delete(); // technologies become uncategorised (nullOnDelete)

        return back()->with('success', 'Category deleted. Its technologies are now uncategorised.');
    }

    public function storeTechnology(Request $request): RedirectResponse
    {
        $data = $this->technology($request);
        Technology::query()->create([...$data, 'slug' => $this->uniqueSlug(Technology::class, $data['name']), 'sort_order' => (int) Technology::query()->max('sort_order') + 1]);

        return back()->with('success', 'Technology added.');
    }

    public function updateTechnology(Request $request, Technology $technology): RedirectResponse
    {
        $technology->update($this->technology($request));

        return back()->with('success', 'Saved.');
    }

    public function destroyTechnology(Technology $technology): RedirectResponse
    {
        $technology->delete();

        return back()->with('success', 'Technology deleted and removed from its projects.');
    }

    /** @return array<string, mixed> */
    private function category(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:200'],
            'icon' => ['nullable', Rule::in(SettingsSchema::ICONS)],
        ]);
    }

    /** @return array<string, mixed> */
    private function technology(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'skill_category_id' => ['nullable', 'integer', Rule::exists('skill_categories', 'id')],
            'show_in_skills' => ['required', 'boolean'],
        ]);
    }

    /** @param class-string<SkillCategory|Technology> $model */
    private function uniqueSlug(string $model, string $name): string
    {
        $base = Str::slug($name) ?: 'item';
        $slug = $base;
        $i = 2;
        while ($model::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}

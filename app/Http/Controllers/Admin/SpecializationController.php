<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Admin\SettingsSchema;
use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Models\Diagram;
use App\Models\Project;
use App\Models\Specialization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** The "Engineering beyond traditional web development" cards. */
final class SpecializationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Specializations/Index', [
            'specializations' => Specialization::query()->orderBy('sort_order')->get(['id', 'title', 'summary']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Specializations/Form', [...$this->options(), 'specialization' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $spec = new Specialization(['sort_order' => (int) Specialization::query()->max('sort_order') + 1]);
        $this->save($spec, $request);

        return redirect()->route('admin.specializations.edit', $spec)->with('success', 'Created.');
    }

    public function edit(Specialization $specialization): Response
    {
        return Inertia::render('Admin/Specializations/Form', [
            ...$this->options(),
            'specialization' => [
                ...$specialization->only(['id', 'title', 'icon', 'summary', 'capabilities']),
                'diagram_id' => $specialization->diagram_id === null ? null : (string) $specialization->diagram_id,
                'projects' => $specialization->projects()->pluck('projects.id')->map(fn ($id) => (string) $id)->all(),
            ],
        ]);
    }

    public function update(Request $request, Specialization $specialization): RedirectResponse
    {
        $this->save($specialization, $request);

        return back()->with('success', 'Saved.');
    }

    public function destroy(Specialization $specialization): RedirectResponse
    {
        $specialization->delete();

        return redirect()->route('admin.specializations.index')->with('success', 'Deleted.');
    }

    private function save(Specialization $spec, Request $request): void
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'icon' => ['nullable', Rule::in(SettingsSchema::ICONS)],
            'summary' => ['required', 'string', 'max:400'],
            'capabilities' => ['present', 'array', 'max:8'],
            'capabilities.*.text' => ['required', 'string', 'max:200'],
            'capabilities.*.status' => ['required', Rule::enum(ProjectStatus::class)],
            'diagram_id' => ['nullable', 'integer', Rule::exists('diagrams', 'id')],
            'projects' => ['present', 'array'],
            'projects.*' => ['integer', 'distinct', Rule::exists('projects', 'id')],
        ]);

        $spec->fill([
            ...Arr::except($data, ['projects']),
            'slug' => $spec->slug ?? Str::slug($data['title']).'-'.Str::lower(Str::random(4)),
        ])->save();
        $spec->projects()->sync($data['projects']);
    }

    /** @return array<string, mixed> */
    private function options(): array
    {
        return [
            'icons' => SettingsSchema::ICONS,
            'statuses' => collect(ProjectStatus::cases())->map(fn (ProjectStatus $s): array => ['value' => $s->value, 'label' => $s->label()]),
            'diagrams' => Diagram::query()->orderBy('sort_order')->get()->map(fn (Diagram $d): array => ['value' => (string) $d->id, 'label' => $d->title]),
            'projects' => Project::query()->ordered()->get()->map(fn (Project $p): array => ['value' => (string) $p->id, 'label' => $p->title]),
        ];
    }
}

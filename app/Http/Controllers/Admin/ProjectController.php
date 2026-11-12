<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProjectRequest;
use App\Models\Diagram;
use App\Models\Project;
use App\Models\Technology;
use App\Support\RichText;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class ProjectController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Projects/Index', [
            'projects' => Project::query()->ordered()->with('media')->get()->map(fn (Project $p): array => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'client' => $p->client,
                'category' => $p->category->label(),
                'status' => ['value' => $p->status->value, 'label' => $p->status->label()],
                'is_featured' => $p->is_featured,
                'published' => $p->published_at !== null,
                'cover' => $p->getFirstMediaUrl('cover', 'card') ?: null,
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Projects/Form', [...$this->options(), 'project' => null]);
    }

    public function store(ProjectRequest $request): RedirectResponse
    {
        $project = DB::transaction(function () use ($request): Project {
            $project = new Project(['sort_order' => (int) Project::query()->max('sort_order') + 1]);
            $this->fill($project, $request);

            return $project;
        });

        return redirect()->route('admin.projects.edit', $project)->with('success', 'Project created. Add a cover and screenshots in the Media tab.');
    }

    public function edit(Project $project): Response
    {
        $project->load(['technologies', 'diagrams', 'media']);

        return Inertia::render('Admin/Projects/Form', [
            ...$this->options(),
            'project' => [
                ...$project->only([
                    'id', 'title', 'slug', 'company', 'client', 'show_client', 'status_note', 'period', 'role',
                    'authorship_note', 'summary', 'problem', 'contribution', 'is_featured',
                ]),
                'category' => $project->category->value,
                'status' => $project->status->value,
                'features' => $project->features ?? [],
                'challenges' => $project->challenges ?? [],
                'metrics' => array_map(fn (array $m): array => ['source' => null, ...$m], $project->metrics ?? []),
                'public_links' => $project->public_links ?? [],
                'seo' => ['title' => $project->seo['title'] ?? null, 'description' => $project->seo['description'] ?? null],
                'published' => $project->published_at !== null,
                'technologies' => $project->technologies->pluck('id')->all(),
                'diagrams' => $project->diagrams->pluck('id')->all(),
                'cover' => $this->media($project->getFirstMedia('cover')),
                'gallery' => $project->getMedia('gallery')->map(fn (Media $m): ?array => $this->media($m))->values(),
            ],
        ]);
    }

    public function update(ProjectRequest $request, Project $project): RedirectResponse
    {
        DB::transaction(fn () => $this->fill($project, $request));

        // The slug may have changed, so go to the (possibly new) edit URL.
        return redirect()->route('admin.projects.edit', $project)->with('success', 'Saved.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return redirect()->route('admin.projects.index')->with('success', "Deleted \"{$project->title}\".");
    }

    private function fill(Project $project, ProjectRequest $request): void
    {
        $data = $request->validated();

        $project->fill([
            ...collect($data)->except(['published', 'technologies', 'diagrams', 'contribution', 'seo'])->all(),
            'contribution' => RichText::clean($data['contribution'] ?? null),
            'seo' => array_filter($data['seo'] ?? [], fn ($v) => $v !== null && $v !== '') ?: null,
            'published_at' => $data['published'] ? ($project->published_at ?? now()) : null,
        ])->save();

        $tech = [];
        foreach (array_values($data['technologies']) as $position => $id) {
            $tech[$id] = ['sort_order' => $position];
        }
        $project->technologies()->sync($tech);
        $project->diagrams()->sync($data['diagrams']);
    }

    /** @return array<string, mixed> */
    private function options(): array
    {
        return [
            'categories' => collect(ProjectCategory::cases())->map(fn (ProjectCategory $c): array => ['value' => $c->value, 'label' => $c->label()]),
            'statuses' => collect(ProjectStatus::cases())->map(fn (ProjectStatus $s): array => ['value' => $s->value, 'label' => $s->label()]),
            'technologies' => Technology::query()->with('category')->orderBy('name')->get()
                ->map(fn (Technology $t): array => ['value' => (string) $t->id, 'label' => $t->name, 'group' => $t->category->name ?? 'Other']),
            'diagrams' => Diagram::query()->orderBy('sort_order')->get(['id', 'title'])
                ->map(fn (Diagram $d): array => ['value' => (string) $d->id, 'label' => $d->title]),
        ];
    }

    /** @return array{id: int, url: string, thumb: string, alt: string, name: string}|null */
    private function media(?Media $media): ?array
    {
        return $media === null ? null : [
            'id' => (int) $media->id,
            'url' => $media->getUrl(),
            'thumb' => $media->getAvailableUrl(['card']),
            'alt' => (string) $media->getCustomProperty('alt', ''),
            'name' => $media->file_name,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Models\Diagram;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Project;
use App\Models\SkillCategory;
use App\Models\Specialization;
use App\Models\Technology;
use Illuminate\Database\Eloquent\Collection;

/**
 * Builds the read-only data the public pages render.
 *
 * Everything is shaped into plain arrays here so the React pages receive
 * exactly what they display and nothing else (no unpublished rows, no hidden
 * client names, no internal columns).
 */
final class PortfolioQuery
{
    public function __construct(private readonly Settings $settings) {}

    /**
     * Hero content, with system-map flows whose project is unpublished or gone
     * left out, so the hero never links to a 404.
     *
     * @param  list<string>  $publishedSlugs
     * @return array<string, mixed>
     */
    private function hero(array $publishedSlugs): array
    {
        $hero = $this->settings->get('hero');
        if (is_array($hero['flows'] ?? null)) {
            $hero['flows'] = array_values(array_filter(
                $hero['flows'],
                fn (mixed $flow): bool => is_array($flow) && in_array($flow['project'] ?? null, $publishedSlugs, true),
            ));
        }

        return $hero;
    }

    /** @return array<string, mixed> */
    public function home(): array
    {
        $projects = Project::query()->published()->ordered()
            ->with(['technologies', 'media'])
            ->get();

        $skills = $this->skills();

        return [
            'hero' => $this->hero($projects->pluck('slug')->all()),
            'about' => $this->settings->get('about'),
            'sections' => $this->settings->get('sections'),
            'skills' => $skills,
            'experiences' => $this->experiences(),
            'education' => Education::query()->orderBy('sort_order')->get()
                ->map(fn (Education $e): array => $e->only(['id', 'degree', 'institution', 'detail', 'started_year', 'ended_year']))
                ->all(),
            'featuredProjects' => $projects->where('is_featured', true)->values()->map($this->card(...))->all(),
            'otherProjects' => $projects->where('is_featured', false)->values()->map($this->card(...))->all(),
            'specializations' => $this->specializations(),
            'diagrams' => Diagram::query()->orderBy('sort_order')->get()->map($this->diagram(...))->all(),
            'stats' => $this->stats($projects, $skills),
        ];
    }

    /**
     * Headline numbers for the hero, counted from the content itself so they
     * can never drift from what the site shows.
     *
     * @param  Collection<int, Project>  $projects  published projects
     * @param  list<array<string, mixed>>  $skills  the skill cards, as shown
     * @return list<array{key: string, value: int, suffix: string}>
     */
    private function stats(Collection $projects, array $skills): array
    {
        $since = Experience::query()->min('started_at');
        $years = $since ? (int) floor(now()->diffInYears($since, true)) : 0;

        $stats = [
            ['key' => 'years', 'value' => $years, 'suffix' => '+'],
            ['key' => 'projects', 'value' => $projects->count(), 'suffix' => ''],
            ['key' => 'live', 'value' => $projects->where('status', ProjectStatus::Live)->count(), 'suffix' => ''],
            ['key' => 'technologies', 'value' => collect($skills)->pluck('technologies')->flatten(1)->pluck('slug')->unique()->count(), 'suffix' => ''],
        ];

        return array_values(array_filter($stats, fn (array $s): bool => $s['value'] > 0));
    }

    /**
     * What the command palette searches: published projects only, small.
     *
     * @return list<array<string, mixed>>
     */
    public function searchIndex(): array
    {
        return Project::query()->published()->ordered()->with('technologies')->get()
            ->map(fn (Project $p): array => [
                'slug' => $p->slug,
                'title' => $p->title,
                'summary' => $p->summary,
                'category' => $p->category->label(),
                'status' => ['value' => $p->status->value, 'label' => $p->status->label()],
                'technologies' => $p->technologies->pluck('name')->all(),
            ])->values()->all();
    }

    /** @return array<string, mixed> */
    public function index(): array
    {
        $projects = Project::query()->published()->ordered()->with(['technologies', 'media'])->get();

        return [
            'projects' => $projects->map($this->card(...))->all(),
            'filters' => [
                'categories' => collect(ProjectCategory::cases())
                    ->filter(fn (ProjectCategory $c): bool => $projects->contains('category', $c))
                    ->map(fn (ProjectCategory $c): array => ['value' => $c->value, 'label' => $c->label()])
                    ->values()->all(),
                'statuses' => collect(ProjectStatus::cases())
                    ->map(fn (ProjectStatus $s): array => ['value' => $s->value, 'label' => $s->label()])
                    ->all(),
                'technologies' => Technology::query()
                    ->whereHas('projects', fn ($q) => $q->published())
                    ->withCount(['projects' => fn ($q) => $q->published()])
                    ->orderByDesc('projects_count')->orderBy('name')
                    ->get()
                    ->map(fn (Technology $t): array => ['slug' => $t->slug, 'name' => $t->name, 'count' => $t->projects_count])
                    ->all(),
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function show(Project $project): array
    {
        $project->loadMissing(['technologies', 'diagrams', 'media']);

        $siblings = Project::query()->published()->ordered()->get(['id', 'slug', 'title']);
        $index = $siblings->search(fn (Project $p): bool => $p->id === $project->id);

        return [
            'project' => [
                ...$this->card($project),
                'role' => $project->role,
                'authorship_note' => $project->authorship_note,
                'problem' => $project->problem,
                'contribution' => $project->contribution,
                'features' => $project->features ?? [],
                'challenges' => $project->challenges ?? [],
                'metrics' => $project->metrics ?? [],
                'public_links' => $project->public_links ?? [],
                'diagrams' => $project->diagrams->map($this->diagram(...))->all(),
                'gallery' => $project->getMedia('gallery')->map(fn ($m): array => [
                    'url' => $m->getAvailableUrl(['large']),
                    'alt' => (string) $m->getCustomProperty('alt', $project->title),
                ])->all(),
            ],
            'previous' => $this->neighbour($siblings, $index === false ? null : $index - 1),
            'next' => $this->neighbour($siblings, $index === false ? null : $index + 1),
        ];
    }

    /** @return array<string, mixed> */
    public function card(Project $project): array
    {
        $cover = $project->getFirstMedia('cover');

        return [
            'slug' => $project->slug,
            'title' => $project->title,
            'summary' => $project->summary,
            'company' => $project->company,
            'client' => $project->show_client ? $project->client : null,
            'period' => $project->period,
            'category' => ['value' => $project->category->value, 'label' => $project->category->label()],
            'status' => ['value' => $project->status->value, 'label' => $project->status->label()],
            'status_note' => $project->status_note,
            'is_featured' => $project->is_featured,
            'technologies' => $project->technologies->map(fn (Technology $t): array => ['slug' => $t->slug, 'name' => $t->name])->all(),
            'cover' => $cover ? ['url' => $cover->getAvailableUrl(['card']), 'alt' => (string) $cover->getCustomProperty('alt', $project->title)] : null,
        ];
    }

    /** @return array<string, mixed> */
    public function diagram(Diagram $diagram): array
    {
        return $diagram->only(['slug', 'title', 'description', 'nodes', 'edges']);
    }

    /** @return list<array<string, mixed>> */
    private function skills(): array
    {
        return SkillCategory::query()->orderBy('sort_order')
            ->with(['technologies' => fn ($q) => $q->where('show_in_skills', true)])
            ->get()
            ->filter(fn (SkillCategory $c): bool => $c->technologies->isNotEmpty())
            ->map(fn (SkillCategory $c): array => [
                'slug' => $c->slug,
                'name' => $c->name,
                'description' => $c->description,
                'icon' => $c->icon,
                'technologies' => $c->technologies->map(fn (Technology $t): array => ['slug' => $t->slug, 'name' => $t->name])->all(),
            ])
            ->values()->all();
    }

    /** @return list<array<string, mixed>> */
    private function experiences(): array
    {
        return Experience::query()->orderBy('sort_order')->with('technologies')->get()
            ->map(fn (Experience $e): array => [
                'id' => $e->id,
                'company' => $e->company,
                'title' => $e->title,
                'location' => $e->location,
                'started_at' => $e->started_at->format('M Y'),
                'ended_at' => $e->ended_at?->format('M Y'),
                'summary' => $e->summary,
                'phases' => $e->phases ?? [],
                'technologies' => $e->technologies->map(fn (Technology $t): array => ['slug' => $t->slug, 'name' => $t->name])->all(),
            ])->all();
    }

    /** @return list<array<string, mixed>> */
    private function specializations(): array
    {
        return Specialization::query()->orderBy('sort_order')
            ->with(['diagram', 'projects' => fn ($q) => $q->published()])
            ->get()
            ->map(fn (Specialization $s): array => [
                'slug' => $s->slug,
                'title' => $s->title,
                'icon' => $s->icon,
                'summary' => $s->summary,
                'capabilities' => collect($s->capabilities)->map(fn (array $c): array => [
                    'text' => $c['text'],
                    'status' => ['value' => $c['status'], 'label' => ProjectStatus::from($c['status'])->label()],
                ])->all(),
                'diagram' => $s->diagram?->slug,
                'projects' => $s->projects->map(fn (Project $p): array => ['slug' => $p->slug, 'title' => $p->title])->all(),
            ])->all();
    }

    /**
     * @param  Collection<int, Project>  $siblings
     * @return array{slug: string, title: string}|null
     */
    private function neighbour(Collection $siblings, ?int $index): ?array
    {
        if ($index === null || ! $siblings->has($index)) {
            return null;
        }

        $p = $siblings[$index];

        return ['slug' => $p->slug, 'title' => $p->title];
    }
}

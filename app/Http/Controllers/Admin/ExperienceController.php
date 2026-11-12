<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Experience;
use App\Models\Technology;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class ExperienceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Experience/Index', [
            'experiences' => Experience::query()->orderBy('sort_order')->get()->map(fn (Experience $e): array => [
                'id' => $e->id,
                'company' => $e->company,
                'title' => $e->title,
                'period' => $e->started_at->format('M Y').' – '.($e->ended_at?->format('M Y') ?? 'Present'),
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Experience/Form', ['experience' => null, 'technologies' => $this->technologies()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $experience = new Experience(['sort_order' => (int) Experience::query()->max('sort_order') + 1]);
        $this->save($experience, $request);

        return redirect()->route('admin.experiences.edit', $experience)->with('success', 'Created.');
    }

    public function edit(Experience $experience): Response
    {
        return Inertia::render('Admin/Experience/Form', [
            'experience' => [
                ...$experience->only(['id', 'company', 'title', 'location', 'summary']),
                'started_at' => $experience->started_at->toDateString(),
                'ended_at' => $experience->ended_at?->toDateString(),
                'phases' => $experience->phases ?? [],
                'technologies' => $experience->technologies()->pluck('technologies.id')->all(),
            ],
            'technologies' => $this->technologies(),
        ]);
    }

    public function update(Request $request, Experience $experience): RedirectResponse
    {
        $this->save($experience, $request);

        return back()->with('success', 'Saved.');
    }

    public function destroy(Experience $experience): RedirectResponse
    {
        $experience->delete();

        return redirect()->route('admin.experiences.index')->with('success', 'Deleted.');
    }

    private function save(Experience $experience, Request $request): void
    {
        $data = $request->validate([
            'company' => ['required', 'string', 'max:160'],
            'title' => ['required', 'string', 'max:160'],
            'location' => ['nullable', 'string', 'max:120'],
            'started_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'summary' => ['nullable', 'string', 'max:600'],
            'phases' => ['present', 'array', 'max:8'],
            'phases.*.title' => ['required', 'string', 'max:120'],
            'phases.*.period' => ['nullable', 'string', 'max:60'],
            'phases.*.points' => ['present', 'array', 'max:15'],
            'phases.*.points.*' => ['required', 'string', 'max:500'],
            'technologies' => ['present', 'array'],
            'technologies.*' => ['integer', 'distinct', Rule::exists('technologies', 'id')],
        ]);

        $experience->fill(Arr::except($data, ['technologies']))->save();
        $experience->technologies()->sync($data['technologies']);
    }

    /** @return list<array{value: string, label: string}> */
    private function technologies(): array
    {
        return Technology::query()->orderBy('name')->get()
            ->map(fn (Technology $t): array => ['value' => (string) $t->id, 'label' => $t->name])->values()->all();
    }
}

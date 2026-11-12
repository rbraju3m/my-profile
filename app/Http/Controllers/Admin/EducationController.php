<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Education;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class EducationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Education/Index', [
            'education' => Education::query()->orderBy('sort_order')
                ->get(['id', 'degree', 'institution', 'detail', 'started_year', 'ended_year']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Education::query()->create([...$this->validated($request), 'sort_order' => (int) Education::query()->max('sort_order') + 1]);

        return back()->with('success', 'Added.');
    }

    public function update(Request $request, Education $education): RedirectResponse
    {
        $education->update($this->validated($request));

        return back()->with('success', 'Saved.');
    }

    public function destroy(Education $education): RedirectResponse
    {
        $education->delete();

        return back()->with('success', 'Deleted.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'degree' => ['required', 'string', 'max:160'],
            'institution' => ['required', 'string', 'max:160'],
            'detail' => ['nullable', 'string', 'max:120'],
            'started_year' => ['nullable', 'integer', 'between:1950,2100'],
            'ended_year' => ['nullable', 'integer', 'between:1950,2100', 'gte:started_year'],
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Cover image and screenshot gallery for a project. Alt text is required. */
final class ProjectMediaController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $data = $request->validate([
            'collection' => ['required', Rule::in(['cover', 'gallery'])],
            'files' => ['required', 'array', 'min:1', 'max:12'],
            'files.*' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
            'alt' => ['required', 'string', 'max:200'],
        ]);

        foreach ($request->file('files', []) as $file) {
            $project->addMedia($file)
                ->withCustomProperties(['alt' => $data['alt']])
                ->toMediaCollection($data['collection']);
        }

        return back()->with('success', 'Uploaded. Web-optimised versions are being generated.');
    }
}

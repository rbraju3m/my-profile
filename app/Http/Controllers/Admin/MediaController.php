<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/** Every uploaded file, where it is used, its alt text, and deletion. */
final class MediaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Media/Index', [
            'media' => Media::query()->with('model')->latest()->paginate(30)->through(fn (Media $m): array => [
                'id' => (int) $m->id,
                'name' => $m->file_name,
                'mime' => $m->mime_type,
                'size' => (int) $m->size,
                'url' => $m->getUrl(),
                'thumb' => str_starts_with((string) $m->mime_type, 'image/') ? $m->getAvailableUrl(['card']) : null,
                'alt' => (string) $m->getCustomProperty('alt', ''),
                'collection' => $m->collection_name,
                'usedBy' => $this->usedBy($m),
            ]),
        ]);
    }

    public function update(Request $request, Media $media): RedirectResponse
    {
        $media->setCustomProperty('alt', $request->validate(['alt' => ['required', 'string', 'max:200']])['alt'])->save();

        return back()->with('success', 'Alt text saved.');
    }

    public function destroy(Media $media): RedirectResponse
    {
        $media->delete();

        return back()->with('success', 'File deleted.');
    }

    /** @return array{label: string, href: string|null} */
    private function usedBy(Media $media): array
    {
        $model = $media->model;

        return match (true) {
            $model instanceof Project => ['label' => $model->title.' · '.$media->collection_name, 'href' => route('admin.projects.edit', $model)],
            $model instanceof Setting => ['label' => ucfirst($model->group).' settings · '.$media->collection_name, 'href' => route('admin.settings.edit', $model->group)],
            default => ['label' => 'Unattached', 'href' => null],
        };
    }
}

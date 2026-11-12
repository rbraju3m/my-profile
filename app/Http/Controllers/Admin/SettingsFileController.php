<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/** Uploads and removes the CV (site settings) and the default share image (SEO settings). */
final class SettingsFileController extends Controller
{
    private const FILES = [
        'cv' => ['group' => 'site', 'rules' => ['required', 'file', 'mimes:pdf', 'max:10240']],
        'og_image' => ['group' => 'seo', 'rules' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:4096', 'dimensions:min_width=600,min_height=315']],
    ];

    public function store(Request $request, string $file): RedirectResponse
    {
        $spec = self::FILES[$file] ?? abort(404);
        $request->validate(['file' => $spec['rules']]);

        $this->row($spec['group'])->addMediaFromRequest('file')->toMediaCollection($file);

        return back()->with('success', $file === 'cv' ? 'CV uploaded. The download button is now live.' : 'Share image uploaded.');
    }

    public function destroy(string $file): RedirectResponse
    {
        $spec = self::FILES[$file] ?? abort(404);
        $this->row($spec['group'])->clearMediaCollection($file);

        return back()->with('success', 'Removed.');
    }

    private function row(string $group): Setting
    {
        return Setting::query()->firstOrCreate(['group' => $group], ['value' => []]);
    }
}

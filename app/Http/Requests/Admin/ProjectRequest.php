<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $project = $this->route('project');

        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('projects', 'slug')->ignore($project instanceof Project ? $project->id : null)],
            'company' => ['nullable', 'string', 'max:120'],
            'client' => ['nullable', 'string', 'max:120'],
            'show_client' => ['required', 'boolean'],
            'category' => ['required', Rule::enum(ProjectCategory::class)],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'status_note' => ['nullable', 'string', 'max:255'],
            'period' => ['nullable', 'string', 'max:60'],
            'role' => ['nullable', 'string', 'max:160'],
            'authorship_note' => ['nullable', 'string', 'max:500'],
            'summary' => ['required', 'string', 'max:600'],
            'problem' => ['nullable', 'string', 'max:2000'],
            'contribution' => ['nullable', 'string', 'max:20000'],
            'features' => ['present', 'array', 'max:20'],
            'features.*' => ['required', 'string', 'max:300'],
            'challenges' => ['present', 'array', 'max:12'],
            'challenges.*.challenge' => ['required', 'string', 'max:400'],
            'challenges.*.solution' => ['required', 'string', 'max:800'],
            'metrics' => ['present', 'array', 'max:8'],
            'metrics.*.label' => ['required', 'string', 'max:80'],
            'metrics.*.value' => ['required', 'string', 'max:60'],
            'metrics.*.source' => ['nullable', 'string', 'max:160'],
            'public_links' => ['present', 'array', 'max:8'],
            'public_links.*.label' => ['required', 'string', 'max:80'],
            'public_links.*.url' => ['required', 'url:https,http', 'max:255'],
            'seo' => ['nullable', 'array'],
            'seo.title' => ['nullable', 'string', 'max:120'],
            'seo.description' => ['nullable', 'string', 'max:300'],
            'is_featured' => ['required', 'boolean'],
            'published' => ['required', 'boolean'],
            'technologies' => ['present', 'array'],
            'technologies.*' => ['integer', 'distinct', Rule::exists('technologies', 'id')],
            'diagrams' => ['present', 'array'],
            'diagrams.*' => ['integer', 'distinct', Rule::exists('diagrams', 'id')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'slug.regex' => 'Use lowercase letters, numbers and hyphens only (e.g. my-project).',
            'public_links.*.url.url' => 'Links must start with https:// or http://.',
            'seo.description.max' => 'Keep the search description under 300 characters.',
        ];
    }
}

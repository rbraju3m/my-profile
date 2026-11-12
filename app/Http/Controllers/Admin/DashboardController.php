<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Diagram;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Technology;
use App\Services\Settings;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

final class DashboardController extends Controller
{
    public function __invoke(Settings $settings): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'counts' => [
                'projects' => Project::query()->count(),
                'published' => Project::query()->published()->count(),
                'technologies' => Technology::query()->count(),
                'experiences' => Experience::query()->count(),
                'diagrams' => Diagram::query()->count(),
                'unread' => ContactMessage::query()->where('status', 'new')->count(),
            ],
            'hasCv' => $settings->hasCv(),
            'messages' => ContactMessage::query()->latest()->limit(5)
                ->get(['id', 'name', 'subject', 'status', 'created_at'])
                ->map(fn (ContactMessage $m): array => [...$m->only(['id', 'name', 'subject', 'status']), 'created_at' => $m->created_at?->diffForHumans()]),
            'activity' => Activity::query()->latest()->limit(10)->get()
                ->map(fn (Activity $a): array => [
                    'id' => $a->id,
                    'description' => $a->description,
                    'subject' => class_basename((string) $a->subject_type),
                    'name' => $this->subjectName($a),
                    'when' => $a->created_at?->diffForHumans(),
                ]),
        ]);
    }

    private function subjectName(Activity $activity): string
    {
        $subject = $activity->subject;

        if ($subject === null) {
            return '#'.$activity->subject_id;
        }

        foreach (['title', 'name', 'company', 'degree', 'group'] as $attribute) {
            $value = $subject->getAttribute($attribute);
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return '#'.$subject->getKey();
    }
}

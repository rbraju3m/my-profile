<?php

declare(strict_types=1);

use App\Admin\SettingsSchema;
use App\Models\ContactMessage;
use App\Models\Diagram;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Setting;
use App\Models\SkillCategory;
use App\Models\Specialization;
use App\Models\Technology;
use App\Models\User;
use App\Services\Settings;
use Database\Seeders\PortfolioSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(PortfolioSeeder::class);
    config(['admin.require_two_factor' => false]);
    $this->actingAs(User::factory()->create());
});

/* ---------------------------------------------------------------- Settings */

it('accepts its own seeded content back for every settings group', function (string $group) {
    $before = app(Settings::class)->get($group);

    $this->put("/admin/settings/{$group}", $before)->assertSessionHasNoErrors();
    $after = app(Settings::class)->get($group);

    // The bio is re-serialised by the sanitiser (' becomes &#039;): same text, and stable on later saves.
    if ($group === 'about') {
        expect(html_entity_decode($after['bio'], ENT_QUOTES))->toBe(html_entity_decode($before['bio'], ENT_QUOTES));
        $this->put('/admin/settings/about', $after)->assertSessionHasNoErrors();
        expect(app(Settings::class)->get('about'))->toEqual($after);
        [$before['bio'], $after['bio']] = [null, null];
    }

    expect($after)->toEqual($before);
})->with(SettingsSchema::GROUPS);

it('returns 404 for an unknown settings group', function () {
    $this->get('/admin/settings/secrets')->assertNotFound();
    $this->put('/admin/settings/secrets', ['x' => 1])->assertNotFound();
});

it('validates settings fields', function (string $group, array $patch, string $error) {
    $value = [...app(Settings::class)->get($group), ...$patch];

    $this->put("/admin/settings/{$group}", $value)->assertSessionHasErrors($error);
})->with([
    'bad email' => ['site', ['email' => 'nope'], 'email'],
    'bad phone' => ['site', ['phone' => 'call me'], 'phone'],
    'social not a URL' => ['site', ['socials' => [['label' => 'X', 'url' => 'javascript:alert(1)', 'icon' => null]]], 'socials.0.url'],
    'unknown icon' => ['site', ['socials' => [['label' => 'X', 'url' => 'https://x.com', 'icon' => 'skull']]], 'socials.0.icon'],
    'flow to missing project' => ['hero', ['flows' => [['label' => 'L', 'project' => 'ghost', 'steps' => ['a', 'b']]]], 'flows.0.project'],
    'cta with data: URL' => ['hero', ['primary_cta' => ['label' => 'Go', 'href' => 'data:text/html,hi']], 'primary_cta.href'],
    'title template without %s' => ['seo', ['title_template' => 'Raju'], 'title_template'],
]);

it('keeps the hero linking to a project after its slug changes, and hides flows to unpublished projects', function () {
    $hero = app(Settings::class)->get('hero');
    $slug = $hero['flows'][0]['project'];
    $project = Project::query()->where('slug', $slug)->firstOrFail();

    $this->put("/admin/projects/{$slug}", projectPayload($project, ['slug' => $slug.'-renamed']))->assertSessionHasNoErrors();
    expect(app(Settings::class)->get('hero')['flows'][0]['project'])->toBe($slug.'-renamed');

    auth()->logout();
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('hero.flows.0.project', $slug.'-renamed')->etc());

    $project->refresh()->update(['published_at' => null]);
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('hero.flows', fn ($flows) => collect($flows)->doesntContain('project', $slug.'-renamed'))
        ->etc());
});

it('uploads and removes the share image, which must be big enough', function () {
    Storage::fake('public');

    $this->post('/admin/files/og_image', ['file' => UploadedFile::fake()->image('og.png', 300, 200)])->assertSessionHasErrors('file');
    $this->post('/admin/files/og_image', ['file' => UploadedFile::fake()->image('og.png', 1200, 630)])->assertSessionHasNoErrors();
    expect(Setting::query()->where('group', 'seo')->firstOrFail()->getFirstMedia('og_image'))->not->toBeNull();

    $this->delete('/admin/files/og_image')->assertSessionHasNoErrors();
    expect(Setting::query()->where('group', 'seo')->firstOrFail()->getFirstMedia('og_image'))->toBeNull();
});

it('removes the CV and the download goes away', function () {
    Storage::fake('public');
    $this->post('/admin/files/cv', ['file' => UploadedFile::fake()->createWithContent('cv.pdf', "%PDF-1.4\n%%EOF")])->assertSessionHasNoErrors();

    $this->delete('/admin/files/cv')->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/cv')->assertNotFound();
});

/* ---------------------------------------------------------------- Projects */

it('validates a project', function (array $patch, string $error) {
    $project = Project::query()->where('slug', 'orbito-erp')->firstOrFail();

    $this->put('/admin/projects/orbito-erp', projectPayload($project, $patch))->assertSessionHasErrors($error);
})->with([
    'duplicate slug' => [['slug' => 'nourish-pms'], 'slug'],
    'slug with spaces' => [['slug' => 'Not A Slug'], 'slug'],
    'unknown status' => [['status' => 'shipped'], 'status'],
    'unknown technology' => [['technologies' => [999999]], 'technologies.0'],
    'javascript: public link' => [['public_links' => [['label' => 'Demo', 'url' => 'javascript:alert(1)']]], 'public_links.0.url'],
]);

it('deletes a project and its links, and the site 404s', function () {
    $project = Project::query()->where('slug', 'nourish-pms')->firstOrFail();

    $this->delete('/admin/projects/nourish-pms')->assertRedirect('/admin/projects');

    expect(Project::query()->whereKey($project->id)->exists())->toBeFalse()
        ->and(DB::table('project_technology')->where('project_id', $project->id)->count())->toBe(0);

    auth()->logout();
    $this->get('/projects/nourish-pms')->assertNotFound();
});

it('requires alt text and images for project uploads', function () {
    Storage::fake('public');

    $this->post('/admin/projects/orbito-erp/media', ['collection' => 'gallery', 'alt' => '', 'files' => [UploadedFile::fake()->image('a.png')]])
        ->assertSessionHasErrors('alt');
    $this->post('/admin/projects/orbito-erp/media', ['collection' => 'gallery', 'alt' => 'x', 'files' => [UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')]])
        ->assertSessionHasErrors('files.0');
    $this->post('/admin/projects/orbito-erp/media', ['collection' => 'secret', 'alt' => 'x', 'files' => [UploadedFile::fake()->image('a.png')]])
        ->assertSessionHasErrors('collection');
});

it('shows a project gallery on the case study in the saved order', function () {
    Storage::fake('public');
    $this->post('/admin/projects/orbito-erp/media', [
        'collection' => 'gallery', 'alt' => 'Screen',
        'files' => [UploadedFile::fake()->image('one.png', 800, 500), UploadedFile::fake()->image('two.png', 800, 500)],
    ])->assertSessionHasNoErrors();

    $ids = Project::query()->where('slug', 'orbito-erp')->firstOrFail()->getMedia('gallery')->pluck('id')->reverse()->values()->all();
    $this->post('/admin/reorder/gallery', ['ids' => $ids])->assertRedirect();

    auth()->logout();
    $this->get('/projects/orbito-erp')->assertInertia(fn (Assert $page) => $page
        ->has('project.gallery', 2)
        ->where('project.gallery.0.alt', 'Screen')
        ->where('project.gallery.0.url', fn ($url) => str_contains($url, 'two'))
        ->etc());
});

/* -------------------------------------------------------------- Experience */

function experiencePayload(array $overrides = []): array
{
    return [
        'company' => 'Acme', 'title' => 'Engineer', 'location' => 'Dhaka', 'summary' => null,
        'started_at' => '2020-01-01', 'ended_at' => '2021-06-30',
        'phases' => [['title' => 'Phase one', 'period' => '2020', 'points' => ['Built a thing']]],
        'technologies' => [Technology::query()->where('slug', 'laravel')->value('id')],
        ...$overrides,
    ];
}

it('creates, updates and deletes an experience entry', function () {
    $this->post('/admin/experiences', experiencePayload())->assertSessionHasNoErrors()->assertRedirect();
    $experience = Experience::query()->where('company', 'Acme')->firstOrFail();
    expect($experience->technologies()->pluck('slug')->all())->toBe(['laravel']);

    $this->put("/admin/experiences/{$experience->id}", experiencePayload(['title' => 'Lead', 'ended_at' => null, 'technologies' => []]))->assertSessionHasNoErrors();
    expect($experience->refresh())->title->toBe('Lead')->ended_at->toBeNull()
        ->and($experience->technologies()->count())->toBe(0);

    $this->delete("/admin/experiences/{$experience->id}")->assertRedirect('/admin/experiences');
    expect(Experience::query()->whereKey($experience->id)->exists())->toBeFalse();
});

it('rejects an experience that ends before it starts', function () {
    $this->post('/admin/experiences', experiencePayload(['ended_at' => '2019-01-01']))->assertSessionHasErrors('ended_at');
});

/* --------------------------------------------------------------- Education */

it('adds, edits and deletes education', function () {
    $this->post('/admin/education', ['degree' => 'MSc', 'institution' => 'DU', 'detail' => null, 'started_year' => 2018, 'ended_year' => 2020])->assertSessionHasNoErrors();
    $row = Education::query()->where('degree', 'MSc')->firstOrFail();

    $this->put("/admin/education/{$row->id}", ['degree' => 'MSc CS', 'institution' => 'DU', 'started_year' => 2018, 'ended_year' => 2017])
        ->assertSessionHasErrors('ended_year');
    $this->put("/admin/education/{$row->id}", ['degree' => 'MSc CS', 'institution' => 'DU', 'started_year' => 2018, 'ended_year' => 2020])->assertSessionHasNoErrors();
    expect($row->refresh()->degree)->toBe('MSc CS');

    $this->delete("/admin/education/{$row->id}")->assertSessionHasNoErrors();
    expect(Education::query()->whereKey($row->id)->exists())->toBeFalse();
});

/* ------------------------------------------------------------------ Skills */

it('manages skill categories and technologies, with unique slugs', function () {
    $this->post('/admin/skill-categories', ['name' => 'Testing', 'description' => null, 'icon' => 'wrench'])->assertSessionHasNoErrors();
    $category = SkillCategory::query()->where('name', 'Testing')->firstOrFail();

    $this->post('/admin/technologies', ['name' => 'Laravel', 'skill_category_id' => $category->id, 'show_in_skills' => true])->assertSessionHasNoErrors();
    $copy = Technology::query()->where('skill_category_id', $category->id)->firstOrFail();
    expect($copy->slug)->toBe('laravel-2');

    $this->put("/admin/technologies/{$copy->id}", ['name' => 'Pest', 'skill_category_id' => $category->id, 'show_in_skills' => false])->assertSessionHasNoErrors();
    expect($copy->refresh())->name->toBe('Pest')->show_in_skills->toBeFalse();

    $this->put("/admin/skill-categories/{$category->id}", ['name' => 'QA', 'icon' => 'not-an-icon'])->assertSessionHasErrors('icon');

    $this->delete("/admin/skill-categories/{$category->id}")->assertSessionHasNoErrors();
    expect($copy->refresh()->skill_category_id)->toBeNull();

    $this->delete("/admin/technologies/{$copy->id}")->assertSessionHasNoErrors();
    expect(Technology::query()->whereKey($copy->id)->exists())->toBeFalse();
});

it('deleting a technology removes it from projects and the filters', function () {
    $dicom = Technology::query()->where('slug', 'dicom')->firstOrFail();

    $this->delete("/admin/technologies/{$dicom->id}")->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/projects')->assertInertia(fn (Assert $page) => $page
        ->where('filters.technologies', fn ($techs) => collect($techs)->doesntContain('slug', 'dicom'))
        ->etc());
});

it('moves technologies between categories when reordering', function () {
    [$from, $to] = SkillCategory::query()->orderBy('sort_order')->take(2)->get()->all();
    $tech = $from->technologies()->firstOrFail();
    $ids = [$tech->id, ...$to->technologies()->pluck('id')->all()];

    $this->post('/admin/reorder/technologies', ['ids' => $ids, 'category_id' => $to->id])->assertRedirect();

    expect($tech->refresh())->skill_category_id->toBe($to->id)->sort_order->toBe(0);
});

it('returns 404 when reordering an unknown list', function () {
    $this->post('/admin/reorder/users', ['ids' => [1]])->assertNotFound();
});

it('reorders every sortable list', function (string $type, string $model) {
    $ids = $model::query()->orderBy('sort_order')->pluck('id')->reverse()->values()->all();

    $this->post("/admin/reorder/{$type}", ['ids' => $ids])->assertRedirect();

    expect($model::query()->orderBy('sort_order')->pluck('id')->all())->toBe($ids);
})->with([
    ['experiences', Experience::class],
    ['education', Education::class],
    ['skill-categories', SkillCategory::class],
    ['specializations', Specialization::class],
    ['diagrams', Diagram::class],
]);

/* --------------------------------------------------------- Specializations */

it('creates, updates and deletes a specialization', function () {
    $payload = [
        'title' => 'Robotics', 'icon' => 'plug', 'summary' => 'Talking to motors.',
        'capabilities' => [['text' => 'Serial control', 'status' => 'research']],
        'diagram_id' => Diagram::query()->value('id'),
        'projects' => [Project::query()->where('slug', 'orbito-erp')->value('id')],
    ];

    $this->post('/admin/specializations', $payload)->assertSessionHasNoErrors();
    $spec = Specialization::query()->where('title', 'Robotics')->firstOrFail();
    expect($spec->projects()->count())->toBe(1);

    $this->put("/admin/specializations/{$spec->id}", [...$payload, 'capabilities' => [['text' => 'x', 'status' => 'live-ish']]])
        ->assertSessionHasErrors('capabilities.0.status');
    $this->put("/admin/specializations/{$spec->id}", [...$payload, 'title' => 'Robotics & IoT', 'diagram_id' => null])->assertSessionHasNoErrors();
    expect($spec->refresh())->title->toBe('Robotics & IoT')->diagram_id->toBeNull();

    $this->delete("/admin/specializations/{$spec->id}")->assertRedirect('/admin/specializations');
    expect(Specialization::query()->whereKey($spec->id)->exists())->toBeFalse();
});

/* ---------------------------------------------------------------- Diagrams */

function diagramPayload(array $overrides = []): array
{
    return [
        'title' => 'Pipeline', 'slug' => 'pipeline', 'description' => null,
        'nodes' => [
            ['id' => 'a', 'label' => 'Device', 'sublabel' => null, 'type' => 'device', 'col' => 0, 'row' => 0],
            ['id' => 'b', 'label' => 'API', 'sublabel' => 'Laravel', 'type' => 'service', 'col' => 1, 'row' => 0],
        ],
        'edges' => [['from' => 'a', 'to' => 'b', 'label' => 'HL7', 'mode' => 'async']],
        ...$overrides,
    ];
}

it('creates, edits and deletes a diagram', function () {
    $this->post('/admin/diagrams', diagramPayload())->assertSessionHasNoErrors();
    $diagram = Diagram::query()->where('slug', 'pipeline')->firstOrFail();
    expect($diagram->nodes[0])->not->toHaveKey('sublabel')
        ->and($diagram->edges[0])->toBe(['from' => 'a', 'to' => 'b', 'label' => 'HL7', 'mode' => 'async']);

    $this->put("/admin/diagrams/{$diagram->id}", diagramPayload(['title' => 'Pipeline v2']))->assertSessionHasNoErrors();
    expect($diagram->refresh()->title)->toBe('Pipeline v2');

    $this->delete("/admin/diagrams/{$diagram->id}")->assertRedirect('/admin/diagrams');
    expect(Diagram::query()->whereKey($diagram->id)->exists())->toBeFalse();
});

it('rejects bad diagrams without crashing', function (array $patch, string $error) {
    $this->post('/admin/diagrams', diagramPayload($patch))->assertSessionHasErrors($error);
})->with([
    'self loop' => [['edges' => [['from' => 'a', 'to' => 'a', 'mode' => 'sync']]], 'edges.0.to'],
    'duplicate node ids' => [['nodes' => [
        ['id' => 'a', 'label' => 'A', 'type' => 'service', 'col' => 0, 'row' => 0],
        ['id' => 'a', 'label' => 'B', 'type' => 'service', 'col' => 1, 'row' => 0],
    ], 'edges' => []], 'nodes.0.id'],
    'off the grid' => [['nodes' => [['id' => 'a', 'label' => 'A', 'type' => 'service', 'col' => 9, 'row' => 0]], 'edges' => []], 'nodes.0.col'],
    'duplicate slug' => [['slug' => 'ocr-pipeline'], 'slug'],
    'edge that is not an object' => [['edges' => ['a->b']], 'edges.0.from'],
    'node that is not an object' => [['nodes' => ['a'], 'edges' => []], 'nodes.0.id'],
]);

it('deleting a diagram detaches it from projects and specializations', function () {
    $diagram = Diagram::query()->whereHas('projects')->firstOrFail();

    $this->delete("/admin/diagrams/{$diagram->id}")->assertRedirect();

    expect(DB::table('diagram_project')->where('diagram_id', $diagram->id)->count())->toBe(0)
        ->and(Specialization::query()->where('diagram_id', $diagram->id)->count())->toBe(0);
    auth()->logout();
    $this->get('/')->assertOk();
});

/* --------------------------------------------------------- Messages, media */

it('filters the inbox and hides spam by default', function () {
    ContactMessage::query()->create(['name' => 'Real', 'email' => 'r@example.com', 'subject' => 'Hi', 'message' => str_repeat('x', 30)]);
    ContactMessage::query()->create(['name' => 'Spam', 'email' => 's@example.com', 'subject' => 'Buy', 'message' => str_repeat('x', 30), 'status' => 'spam']);

    $this->get('/admin/messages')->assertInertia(fn (Assert $page) => $page->has('messages.data', 1)->where('messages.data.0.name', 'Real')->etc());
    $this->get('/admin/messages?status=spam')->assertInertia(fn (Assert $page) => $page->has('messages.data', 1)->where('messages.data.0.name', 'Spam')->etc());
    $this->get('/admin/messages?status=bogus')->assertInertia(fn (Assert $page) => $page->where('status', null)->has('messages.data', 1)->etc());
});

it('rejects an unknown message status and deletes messages', function () {
    $message = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'subject' => 'Hi', 'message' => str_repeat('x', 30)]);

    $this->patch("/admin/messages/{$message->id}", ['status' => 'deleted'])->assertSessionHasErrors('status');
    $this->delete("/admin/messages/{$message->id}")->assertRedirect('/admin/messages');
    expect(ContactMessage::query()->count())->toBe(0);
});

it('edits alt text and deletes files in the media library', function () {
    Storage::fake('public');
    $this->post('/admin/projects/orbito-erp/media', ['collection' => 'cover', 'alt' => 'Old', 'files' => [UploadedFile::fake()->image('c.png', 800, 500)]]);
    $media = Project::query()->where('slug', 'orbito-erp')->firstOrFail()->getFirstMedia('cover');

    $this->get('/admin/media')->assertInertia(fn (Assert $page) => $page
        ->where('media.data.0.usedBy.label', 'Orbito ERP · cover')->etc());

    $this->patch("/admin/media/{$media->id}", ['alt' => ''])->assertSessionHasErrors('alt');
    $this->patch("/admin/media/{$media->id}", ['alt' => 'Dashboard with demo data'])->assertSessionHasNoErrors();
    expect($media->refresh()->getCustomProperty('alt'))->toBe('Dashboard with demo data');

    $this->delete("/admin/media/{$media->id}")->assertSessionHasNoErrors();
    expect(Project::query()->where('slug', 'orbito-erp')->firstOrFail()->getFirstMedia('cover'))->toBeNull();
});

it('shows recent activity on the dashboard', function () {
    $this->put('/admin/education/'.Education::query()->value('id'), ['degree' => 'Changed', 'institution' => 'X']);

    $this->get('/admin')->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard')->etc());
    expect(Activity::query()->where('subject_type', Education::class)->exists())->toBeTrue();
});

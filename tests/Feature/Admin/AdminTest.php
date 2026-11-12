<?php

declare(strict_types=1);

use App\Models\ContactMessage;
use App\Models\Diagram;
use App\Models\Project;
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
    $this->admin = User::factory()->create();
});

function projectPayload(Project $project, array $overrides = []): array
{
    return [
        ...$project->only(['title', 'slug', 'company', 'client', 'show_client', 'status_note', 'period', 'role', 'authorship_note', 'summary', 'problem', 'contribution', 'is_featured']),
        'category' => $project->category->value,
        'status' => $project->status->value,
        'features' => $project->features ?? [],
        'challenges' => $project->challenges ?? [],
        'metrics' => $project->metrics ?? [],
        'public_links' => $project->public_links ?? [],
        'seo' => ['title' => null, 'description' => null],
        'published' => true,
        'technologies' => $project->technologies()->pluck('technologies.id')->all(),
        'diagrams' => $project->diagrams()->pluck('diagrams.id')->all(),
        ...$overrides,
    ];
}

it('sends guests to the admin login', function () {
    $this->get('/admin')->assertRedirect('/admin/login');
    $this->get('/admin/login')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Auth/Login'));
});

it('keeps the admin out of search engines and server rendering', function () {
    $this->get('/admin/login')->assertSee('noindex, nofollow', false);
});

it('requires two-factor before content can be edited, but lets you reach the account page', function () {
    config(['admin.require_two_factor' => true]);

    $this->actingAs($this->admin)->get('/admin')->assertRedirect('/admin/account');
    $this->actingAs($this->admin)->get('/admin/account')->assertOk();

    $this->admin->forceFill(['two_factor_secret' => encrypt('x'), 'two_factor_confirmed_at' => now()])->save();
    $this->actingAs($this->admin)->get('/admin')->assertOk();
});

it('renders every admin screen', function (string $url, string $component) {
    $this->actingAs($this->admin)->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['/admin', 'Admin/Dashboard'],
    ['/admin/projects', 'Admin/Projects/Index'],
    ['/admin/projects/create', 'Admin/Projects/Form'],
    ['/admin/projects/orbito-erp/edit', 'Admin/Projects/Form'],
    ['/admin/experiences', 'Admin/Experience/Index'],
    ['/admin/experiences/create', 'Admin/Experience/Form'],
    ['/admin/skills', 'Admin/Skills/Index'],
    ['/admin/specializations', 'Admin/Specializations/Index'],
    ['/admin/diagrams', 'Admin/Diagrams/Index'],
    ['/admin/diagrams/create', 'Admin/Diagrams/Form'],
    ['/admin/education', 'Admin/Education/Index'],
    ['/admin/messages', 'Admin/Messages/Index'],
    ['/admin/media', 'Admin/Media/Index'],
    ['/admin/account', 'Admin/Account'],
    ['/admin/settings/site', 'Admin/Settings/Edit'],
    ['/admin/settings/hero', 'Admin/Settings/Edit'],
    ['/admin/settings/about', 'Admin/Settings/Edit'],
    ['/admin/settings/sections', 'Admin/Settings/Edit'],
    ['/admin/settings/nav', 'Admin/Settings/Edit'],
    ['/admin/settings/footer', 'Admin/Settings/Edit'],
    ['/admin/settings/seo', 'Admin/Settings/Edit'],
]);

it('rejects javascript: links in settings', function () {
    $this->actingAs($this->admin)
        ->put('/admin/settings/nav', ['items' => [['label' => 'Evil', 'href' => 'javascript:alert(1)']]])
        ->assertSessionHasErrors('items.0.href');
});

it('sanitises the biography before it reaches the site', function () {
    $about = app(Settings::class)->get('about');

    $this->actingAs($this->admin)
        ->put('/admin/settings/about', [...$about, 'bio' => '<p>Hello <strong>there</strong><script>alert(1)</script><img src=x onerror=alert(1)></p>'])
        ->assertSessionHasNoErrors();

    $bio = app(Settings::class)->get('about')['bio'];
    expect($bio)->toContain('<strong>there</strong>')->not->toContain('script')->not->toContain('onerror');
});

it('updates a project, keeps technology order, and follows a slug change', function () {
    $project = Project::query()->where('slug', 'orbito-erp')->firstOrFail();
    $tech = Technology::query()->whereIn('slug', ['react', 'laravel'])->get()->sortBy(fn ($t) => $t->slug === 'react' ? 0 : 1)->pluck('id')->all();

    $this->actingAs($this->admin)
        ->put('/admin/projects/orbito-erp', projectPayload($project, ['slug' => 'orbito', 'title' => 'Orbito', 'technologies' => $tech, 'contribution' => '<p>ok</p><script>x</script>']))
        ->assertRedirect('/admin/projects/orbito/edit');

    $project->refresh();
    expect($project->slug)->toBe('orbito')
        ->and($project->technologies->pluck('slug')->all())->toBe(['react', 'laravel'])
        ->and($project->contribution)->toBe('<p>ok</p>');

    expect(Activity::query()->where('subject_type', Project::class)->where('subject_id', $project->id)->exists())->toBeTrue();
});

it('unpublishing a project takes it off the site', function () {
    $project = Project::query()->where('slug', 'nourish-pms')->firstOrFail();

    $this->actingAs($this->admin)->put('/admin/projects/nourish-pms', projectPayload($project, ['published' => false]))->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/projects/nourish-pms')->assertNotFound();
});

it('creates a project as a draft', function () {
    $this->actingAs($this->admin)->post('/admin/projects', [
        'title' => 'New thing', 'slug' => 'new-thing', 'company' => null, 'client' => null, 'show_client' => true,
        'category' => 'web', 'status' => 'research', 'status_note' => null, 'period' => null, 'role' => null,
        'authorship_note' => null, 'summary' => 'Short summary.', 'problem' => null, 'contribution' => null,
        'features' => [], 'challenges' => [], 'metrics' => [], 'public_links' => [], 'seo' => [],
        'is_featured' => false, 'published' => false, 'technologies' => [], 'diagrams' => [],
    ])->assertRedirect('/admin/projects/new-thing/edit');

    expect(Project::query()->where('slug', 'new-thing')->firstOrFail()->published_at)->toBeNull();
});

it('rejects diagram arrows to missing boxes and two boxes in one cell', function () {
    $this->actingAs($this->admin)->post('/admin/diagrams', [
        'title' => 'Bad', 'slug' => 'bad', 'description' => null,
        'nodes' => [
            ['id' => 'a', 'label' => 'A', 'sublabel' => null, 'type' => 'service', 'col' => 0, 'row' => 0],
            ['id' => 'b', 'label' => 'B', 'sublabel' => null, 'type' => 'service', 'col' => 0, 'row' => 0],
        ],
        'edges' => [['from' => 'a', 'to' => 'ghost', 'label' => null, 'mode' => 'sync']],
    ])->assertSessionHasErrors(['edges.0.to', 'nodes.0.col']);

    expect(Diagram::query()->where('slug', 'bad')->exists())->toBeFalse();
});

it('saves drag-and-drop order', function () {
    $ids = Project::query()->ordered()->pluck('id')->reverse()->values()->all();

    $this->actingAs($this->admin)->post('/admin/reorder/projects', ['ids' => $ids])->assertRedirect();

    expect(Project::query()->ordered()->pluck('id')->all())->toBe($ids);
});

it('uploads a CV and serves it at /cv', function () {
    Storage::fake('public');
    $pdf = UploadedFile::fake()->createWithContent('my cv.pdf', "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

    $this->actingAs($this->admin)->post('/admin/files/cv', ['file' => $pdf])->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('site.has_cv', true)->etc());
    $this->get('/cv')->assertOk()->assertDownload('rashedul-raju-cv.pdf');
});

it('only accepts PDFs as the CV', function () {
    $this->actingAs($this->admin)
        ->post('/admin/files/cv', ['file' => UploadedFile::fake()->image('cv.png')])
        ->assertSessionHasErrors('file');
});

it('uploads project screenshots with alt text', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)->post('/admin/projects/orbito-erp/media', [
        'collection' => 'gallery',
        'alt' => 'Sales screen with demo data',
        'files' => [UploadedFile::fake()->image('a.png', 1200, 700)],
    ])->assertSessionHasNoErrors();

    $media = Project::query()->where('slug', 'orbito-erp')->firstOrFail()->getMedia('gallery');
    expect($media)->toHaveCount(1)->and($media->first()->getCustomProperty('alt'))->toBe('Sales screen with demo data');
});

it('marks a message read when opened and lets you file it', function () {
    $message = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'subject' => 'Hi', 'message' => str_repeat('x', 30)]);

    $this->actingAs($this->admin)->get("/admin/messages/{$message->id}")->assertOk();
    expect($message->refresh()->status)->toBe('read');

    $this->actingAs($this->admin)->patch("/admin/messages/{$message->id}", ['status' => 'spam'])->assertSessionHasNoErrors();
    expect($message->refresh()->status)->toBe('spam');
});

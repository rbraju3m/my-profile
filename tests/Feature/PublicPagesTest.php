<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\Technology;
use Database\Seeders\PortfolioSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => $this->seed(PortfolioSeeder::class));

it('renders the home page with every section filled from the database', function () {
    $this->get('/')
        ->assertOk()
        ->assertSee('<title data-inertia>Md. Rashedul Bari Raju · Senior Software Engineer (Laravel &amp; React)</title>', false)
        ->assertSee('application/ld+json', false)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Site/Home')
            ->where('hero.headline', 'Building scalable software for real-world problems.')
            ->has('skills', 8)
            ->has('experiences', 1)
            ->has('education', 3)
            ->has('featuredProjects', 9)
            ->has('specializations', 3)
            ->has('diagrams', 6)
            ->where('site.title', 'Senior Software Engineer')
            ->etc());
});

it('never puts the email or phone in plain text in the HTML', function () {
    $html = $this->get('/')->getContent();

    expect($html)->not->toContain('rbraju3m@gmail.com')
        ->and($html)->not->toContain('1729762344');
});

it('hides unpublished projects everywhere', function () {
    Project::query()->where('slug', 'orbito-erp')->update(['published_at' => null]);

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('featuredProjects', fn ($projects) => collect($projects)->doesntContain('slug', 'orbito-erp'))
        ->etc());
    $this->get('/projects')->assertInertia(fn (Assert $page) => $page
        ->where('projects', fn ($projects) => collect($projects)->doesntContain('slug', 'orbito-erp'))
        ->etc());
    $this->get('/projects/orbito-erp')->assertNotFound();
});

it('hides the client name when the admin switches it off', function () {
    Project::query()->where('slug', 'nourish-pms')->update(['show_client' => false]);

    $this->get('/projects/nourish-pms')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('project.client', null)->etc());
});

it('renders a case study with its diagram, status note and breadcrumbs', function () {
    $this->get('/projects/ultrasound-dicom-integration')
        ->assertOk()
        ->assertSee('"@type":"BreadcrumbList"', false)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Site/Projects/Show')
            ->where('project.status.value', 'built')
            ->where('project.status_note', 'Validated end to end against a simulated machine; on-site rollout in progress.')
            ->has('project.diagrams', 1)
            ->has('project.challenges', 4)
            ->etc());
});

it('lists projects with filters built from the data', function () {
    $this->get('/projects')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Site/Projects/Index')
            ->has('projects', 20)
            ->has('filters.statuses', 4)
            ->where('filters.technologies.0.slug', 'laravel')
            ->etc());
});

it('returns 404 for the CV until one is uploaded', function () {
    $this->get('/cv')->assertNotFound();
});

it('passes filters from the query string so a filtered link renders the same on the server', function () {
    $this->get('/projects?tech=dicom&status=built&q=ultrasound')
        ->assertInertia(fn (Assert $page) => $page
            ->where('initial.tech', 'dicom')
            ->where('initial.status', 'built')
            ->where('initial.query', 'ultrasound')
            ->where('initial.category', null)
            ->etc());
});

it('counts the hero numbers from the content itself', function () {
    $published = Project::query()->published()->count();
    $live = Project::query()->published()->where('status', 'live')->count();

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('stats', fn ($stats) => collect($stats)->firstWhere('key', 'projects')['value'] === $published
            && (collect($stats)->firstWhere('key', 'live')['value'] ?? 0) === $live
            && collect($stats)->firstWhere('key', 'years')['value'] > 0
            && collect($stats)->every(fn ($s) => $s['value'] > 0))
        // The technologies number is exactly what the skill cards show.
        ->where('stats', fn ($stats) => collect($stats)->firstWhere('key', 'technologies')['value']
            === Technology::query()->where('show_in_skills', true)->whereHas('category')->count())
        ->etc());
});

it('serves the command palette index with published projects only', function () {
    Project::query()->where('slug', 'orbito-erp')->update(['published_at' => null]);

    $response = $this->getJson('/search.json')->assertOk()
        ->assertJsonStructure(['projects' => [['slug', 'title', 'summary', 'category', 'status' => ['value', 'label'], 'technologies']]]);

    expect(collect($response->json('projects'))->pluck('slug'))
        ->not->toContain('orbito-erp')
        ->toHaveCount(Project::query()->published()->count());
    expect($response->headers->get('Cache-Control'))->toContain('private')->not->toContain('public');
});

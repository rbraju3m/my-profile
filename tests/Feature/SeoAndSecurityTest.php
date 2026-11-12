<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use Database\Seeders\PortfolioSeeder;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;

beforeEach(fn () => $this->seed(PortfolioSeeder::class));

it('sets security headers on public pages', function () {
    $response = $this->get('/');

    $response->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeaderMissing('Strict-Transport-Security');

    $csp = (string) $response->headers->get('Content-Security-Policy');
    expect($csp)->toContain("frame-ancestors 'none'")
        ->toContain("object-src 'none'")
        ->not->toContain("'unsafe-eval'")
        ->and(preg_match("/script-src [^;]*'unsafe-inline'/", $csp))->toBe(0);

    // Every inline script that runs carries this request's nonce (JSON data blocks never run).
    preg_match("/'nonce-([^']+)'/", $csp, $m);
    preg_match_all('/<script(?![^>]*\b(?:src=|type="application\/(?:ld\+)?json"))[^>]*>/', (string) $response->getContent(), $inline);
    expect($inline[0])->not->toBeEmpty();
    foreach ($inline[0] as $tag) {
        expect($tag)->toContain('nonce="'.$m[1].'"');
    }
});

it('adds HSTS over HTTPS', function () {
    $this->get('https://localhost/')->assertHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
});

it('writes social cards and a canonical URL without the query string', function () {
    $this->get('/projects?tech=laravel')
        ->assertSee('<link rel="canonical" href="'.url('/projects').'">', false)
        ->assertSee('property="og:title"', false)
        ->assertSee('name="twitter:card"', false);
});

it('uses the project SEO override on a case study', function () {
    Project::query()->where('slug', 'orbito-erp')->update(['seo' => ['title' => 'Custom ERP title', 'description' => 'Custom description.']]);

    $this->get('/projects/orbito-erp')
        ->assertSee('Custom ERP title', false)
        ->assertSee('<meta name="description" content="Custom description."', false);
});

it('lists only published projects in the sitemap', function () {
    Project::query()->where('slug', 'nourish-pms')->update(['published_at' => null]);

    $xml = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'text/xml; charset=UTF-8')->getContent();

    expect($xml)->toContain(url('/projects/orbito-erp'))
        ->not->toContain('/projects/nourish-pms')
        ->not->toContain('/admin');
    expect(substr_count((string) $xml, '<url>'))->toBe(2 + Project::query()->published()->count());
});

it('blocks all crawling outside production', function () {
    $this->get('/robots.txt')->assertOk()->assertSee("Disallow: /\n", false)->assertDontSee('Sitemap:');
});

it('allows crawling in production but not the admin', function () {
    app()->detectEnvironment(fn () => 'production');

    $this->get('/robots.txt')->assertOk()
        ->assertSee('Disallow: /admin')
        ->assertSee('Sitemap: '.url('/sitemap.xml'))
        ->assertDontSee("Disallow: /\n", false);
});

it('returns 404 for unknown pages and project slugs', function (string $uri) {
    $this->get($uri)->assertNotFound();
})->with(['/nope', '/projects/does-not-exist', '/projects/../admin']);

it('does not leak admin-only project fields to the site', function () {
    $this->get('/projects/orbito-erp')->assertInertia(fn ($page) => $page
        ->missing('project.published_at')
        ->missing('project.sort_order')
        ->missing('project.seo')
        ->missing('project.created_at')
        ->etc());
});

it('shows a branded, unindexed 404 page', function (string $uri) {
    $this->get($uri)
        ->assertNotFound()
        ->assertSee('<meta name="robots" content="noindex">', false)
        ->assertSee('Page not found · ', false)
        ->assertInertia(fn ($page) => $page->component('Site/Error')->where('status', 404));
})->with(['/nope', '/projects/does-not-exist']);

it('keeps Laravel error pages in the admin', function () {
    config(['admin.require_two_factor' => false]);
    $this->actingAs(User::factory()->create())->get('/admin/projects/ghost/edit')
        ->assertNotFound()
        ->assertDontSee('Site/Error');
});

it('sends an expired form back with the typed text and a clear error', function () {
    // Laravel always skips the CSRF check in tests, so raise its exception directly.
    Route::middleware('web')->post('/_csrf-expired', fn () => throw new TokenMismatchException);

    $this->from('/')->post('/_csrf-expired', ['name' => 'Ada'])
        ->assertRedirect('/')
        ->assertSessionHasErrors('form');
    expect(session()->getOldInput('name'))->toBe('Ada');
});

<?php

declare(strict_types=1);

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\PortfolioSeeder;

beforeEach(function () {
    $this->seed(PortfolioSeeder::class);
    config(['responsecache.enabled' => true]);
});

it('serves the second anonymous visit from the cache, with a fresh CSP nonce', function () {
    $first = $this->get('/projects');
    $second = $this->get('/projects');

    $first->assertOk()->assertHeaderMissing('laravel-responsecache');
    $second->assertOk();

    $nonceOf = fn ($response) => preg_match("/'nonce-([^']+)'/", (string) $response->headers->get('Content-Security-Policy'), $m) ? $m[1] : null;
    $secondNonce = $nonceOf($second);

    expect($secondNonce)->not->toBeNull()
        ->and($second->getContent())->toContain('nonce="'.$secondNonce.'"')
        ->and($second->getContent())->not->toContain('<csp-nonce-placeholder>');

    // Session and XSRF cookies are issued fresh to each visitor (never replayed from
    // the cache), which is what keeps the contact form's CSRF check working.
    $xsrf = fn ($response) => collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === 'XSRF-TOKEN')?->getValue();
    expect($xsrf($second))->not->toBeNull()->not->toBe($xsrf($first));
});

it('never caches Inertia navigations', function () {
    $headers = ['X-Inertia' => 'true', 'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request())];

    $this->get('/projects', $headers)->assertOk();
    Project::query()->where('slug', 'orbito-erp')->update(['title' => 'Renamed directly in the database']);

    $this->get('/projects', $headers)->assertOk()->assertSee('Renamed directly in the database');
});

it('clears the cache when the admin saves anything', function () {
    $this->get('/')->assertSee('Building scalable software');

    $this->actingAs(User::factory()->create())
        ->put('/admin/settings/footer', ['tagline' => 'A new footer line', 'copyright' => '© {year}'])
        ->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/')->assertSee('A new footer line');
});

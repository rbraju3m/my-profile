<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\Settings;
use App\Support\SiteLabels;
use App\Support\Themes;
use Database\Seeders\PortfolioSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(PortfolioSeeder::class);
    config(['admin.require_two_factor' => false]);
    $this->admin = User::factory()->create();
});

/* ------------------------------------------------------------------ Themes */

it('defaults to the dark theme and offers every theme', function () {
    $config = app(Themes::class)->config();

    expect($config['default'])->toBe('dark')
        ->and($config['picker'])->toBeTrue()
        ->and(array_column($config['themes'], 'key'))->toBe(array_keys(Themes::ALL));
});

it('writes the theme config into the pre-paint script and shares it with the pages', function () {
    $this->get('/')
        ->assertOk()
        ->assertSee('"default":"dark"', false)
        ->assertSee('<meta name="theme-color" content="#0a0b0d">', false)
        ->assertInertia(fn (Assert $page) => $page->where('appearance.default', 'dark')->has('appearance.themes', count(Themes::ALL))->etc());
});

it('saves the default theme and the themes on offer', function () {
    $this->actingAs($this->admin)
        ->put('/admin/settings/appearance', ['default_theme' => 'midnight', 'themes' => ['midnight', 'paper'], 'picker' => false])
        ->assertSessionHasNoErrors();

    $config = app(Themes::class)->config();
    expect($config['default'])->toBe('midnight')
        ->and($config['picker'])->toBeFalse()
        ->and(array_column($config['themes'], 'key'))->toBe(['midnight', 'paper']);
});

it('rejects a default theme that is not on offer, and unknown themes', function () {
    $this->actingAs($this->admin)
        ->put('/admin/settings/appearance', ['default_theme' => 'dark', 'themes' => ['light'], 'picker' => true])
        ->assertSessionHasErrors('default_theme');

    $this->actingAs($this->admin)
        ->put('/admin/settings/appearance', ['default_theme' => 'dark', 'themes' => ['dark', 'neon'], 'picker' => true])
        ->assertSessionHasErrors('themes.1');

    $this->actingAs($this->admin)
        ->put('/admin/settings/appearance', ['default_theme' => Themes::SYSTEM, 'themes' => ['dark', 'light'], 'picker' => true])
        ->assertSessionHasNoErrors();
});

it('never breaks the page over bad stored appearance data', function () {
    app(Settings::class)->put('appearance', ['default_theme' => 'gone', 'themes' => ['gone']]);

    $config = app(Themes::class)->config();
    expect($config['default'])->toBe('dark')->and(array_column($config['themes'], 'key'))->toBe(['dark', 'light']);
});

/* ------------------------------------------------------------------ Labels */

it('shares the default labels, and uses saved ones instead', function () {
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('labels.contact.send', 'Send message')->etc());

    $this->actingAs($this->admin)
        ->put('/admin/settings/labels', ['contact' => ['send' => 'Send it', 'name' => '']])
        ->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('labels.contact.send', 'Send it')
        // Empty falls back to the default.
        ->where('labels.contact.name', 'Name')
        ->etc());
});

it('limits label length and ignores unknown keys', function () {
    $this->actingAs($this->admin)
        ->put('/admin/settings/labels', ['contact' => ['send' => str_repeat('x', 201)]])
        ->assertSessionHasErrors('contact.send');

    $this->actingAs($this->admin)->put('/admin/settings/labels', ['contact' => ['nope' => 'x']])->assertSessionHasNoErrors();
    expect(app(Settings::class)->get('labels'))->not->toHaveKey('contact.nope');
    expect(SiteLabels::resolve(app(Settings::class)->get('labels'))['contact'])->not->toHaveKey('nope');
});

/* ------------------------------------------------------------------- Photo */

it('uploads a photo, shares its two sizes and adds it to the Person data', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)
        ->post('/admin/files/photo', ['file' => UploadedFile::fake()->image('me.jpg', 800, 1000)])
        ->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/')
        ->assertSee('me-portrait.webp', false)
        ->assertInertia(fn (Assert $page) => $page
            ->where('site.photo.portrait', fn (string $url) => str_ends_with($url, 'conversions/me-portrait.webp'))
            ->where('site.photo.avatar', fn (string $url) => str_ends_with($url, 'conversions/me-avatar.webp'))
            ->etc());
});

it('rejects a photo that is too small or not an image', function () {
    $this->actingAs($this->admin)
        ->post('/admin/files/photo', ['file' => UploadedFile::fake()->image('tiny.jpg', 100, 100)])
        ->assertSessionHasErrors('file');

    $this->actingAs($this->admin)
        ->post('/admin/files/photo', ['file' => UploadedFile::fake()->create('cv.pdf', 10, 'application/pdf')])
        ->assertSessionHasErrors('file');
});

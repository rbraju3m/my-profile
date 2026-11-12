<?php

declare(strict_types=1);

use App\Mail\NewContactMessage;
use App\Models\ContactMessage;
use App\Services\Settings;
use Database\Seeders\PortfolioSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

beforeEach(fn () => $this->seed(PortfolioSeeder::class));

function validMessage(array $overrides = []): array
{
    return [
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'subject' => 'Backend role',
        'message' => 'We are hiring a senior Laravel engineer for a healthcare product.',
        'website' => '',
        ...$overrides,
    ];
}

it('stores a valid message and confirms it', function () {
    $this->from('/')->post('/contact', validMessage())
        ->assertRedirect('/')
        ->assertSessionHas('success');

    $message = ContactMessage::query()->sole();
    expect($message->status)->toBe('new')
        ->and($message->ip_hash)->not->toBe('127.0.0.1')
        ->and(strlen((string) $message->ip_hash))->toBe(64);
});

it('rejects invalid input with field errors', function () {
    $this->from('/')->post('/contact', validMessage(['email' => 'not-an-email', 'message' => 'too short']))
        ->assertSessionHasErrors(['email', 'message']);

    expect(ContactMessage::query()->count())->toBe(0);
});

it('strips markup before storing', function () {
    $this->from('/')->post('/contact', validMessage(['subject' => '<b>Hello</b> there', 'message' => '<script>alert(1)</script>We would like to talk about a project.']));

    $message = ContactMessage::query()->sole();
    expect($message->subject)->toBe('Hello there')
        ->and($message->message)->not->toContain('<script>');
});

it('pretends to accept honeypot submissions but stores nothing', function () {
    $this->from('/')->post('/contact', validMessage(['website' => 'http://spam.example']))
        ->assertSessionHas('success');

    expect(ContactMessage::query()->count())->toBe(0);
});

it('limits one address to five messages an hour', function () {
    foreach (range(1, 5) as $i) {
        $this->from('/')->post('/contact', validMessage())->assertSessionHasNoErrors();
    }

    $this->from('/')->post('/contact', validMessage())->assertSessionHasErrors('form');
    expect(ContactMessage::query()->count())->toBe(5);
});

it('requires a CSRF token, like every other form', function () {
    // Laravel skips the CSRF check in tests unless asked; this asserts it is not exempted.
    expect(collect(app(ValidateCsrfToken::class)->getExcludedPaths()))->not->toContain('contact');
});

it('emails the owner, queued, with the sender as reply-to', function () {
    Mail::fake();

    $this->from('/')->post('/contact', validMessage())->assertSessionHasNoErrors();

    Mail::assertQueued(NewContactMessage::class, fn ($mail) => $mail->hasTo('rbraju3m@gmail.com') && $mail->hasReplyTo('ada@example.com'));
});

it('rejects the message when Turnstile is configured and the token fails', function () {
    config(['services.turnstile.site_key' => 'site', 'services.turnstile.secret_key' => 'secret']);
    Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => false])]);

    $this->from('/')->post('/contact', validMessage(['cf-turnstile-response' => 'bad']))->assertSessionHasErrors('form');
    expect(ContactMessage::query()->count())->toBe(0);
});

it('accepts the message when Turnstile confirms the token', function () {
    config(['services.turnstile.site_key' => 'site', 'services.turnstile.secret_key' => 'secret']);
    Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => true])]);

    $this->from('/')->post('/contact', validMessage(['cf-turnstile-response' => 'good']))->assertSessionHasNoErrors();
    expect(ContactMessage::query()->count())->toBe(1);
});

it('limits one address to twenty messages a day', function () {
    foreach (range(1, 20) as $i) {
        if ($i % 5 === 1 && $i > 1) {
            $this->travel(61)->minutes();
        }
        $this->from('/')->post('/contact', validMessage())->assertSessionHasNoErrors();
    }

    $this->travel(61)->minutes();
    $this->from('/')->post('/contact', validMessage())->assertSessionHasErrors('form');
    expect(ContactMessage::query()->count())->toBe(20);
});

it('counts the limit per address, not for everyone', function () {
    foreach (range(1, 5) as $i) {
        $this->from('/')->post('/contact', validMessage());
    }

    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])->from('/')->post('/contact', validMessage())->assertSessionHasNoErrors();
});

it('enforces field length limits', function (array $patch, string $field) {
    $this->from('/')->post('/contact', validMessage($patch))->assertSessionHasErrors($field);
})->with([
    'name too long' => [['name' => str_repeat('a', 121)], 'name'],
    'subject too long' => [['subject' => str_repeat('a', 161)], 'subject'],
    'message too long' => [['message' => str_repeat('a', 5001)], 'message'],
    'message only markup' => [['message' => '<b></b><i></i><script></script>'], 'message'],
    'missing email' => [['email' => ''], 'email'],
]);

it('does not email anyone for honeypot submissions', function () {
    Mail::fake();

    $this->from('/')->post('/contact', validMessage(['website' => 'x']));

    Mail::assertNothingQueued();
});

it('does not call Turnstile when the form already has errors', function () {
    config(['services.turnstile.site_key' => 'site', 'services.turnstile.secret_key' => 'secret']);
    Http::fake();

    $this->from('/')->post('/contact', validMessage(['email' => 'bad']))->assertSessionHasErrors('email');

    Http::assertNothingSent();
});

it('treats a Turnstile outage as a failed check, not a crash', function () {
    config(['services.turnstile.site_key' => 'site', 'services.turnstile.secret_key' => 'secret']);
    Http::fake(['challenges.cloudflare.com/*' => Http::response('down', 500)]);

    $this->from('/')->post('/contact', validMessage(['cf-turnstile-response' => 'x']))->assertSessionHasErrors('form');
});

it('shows the success text from the admin settings', function () {
    $sections = app(Settings::class)->get('sections');
    $sections['contact']['success'] = 'Got it, I will reply soon.';
    app(Settings::class)->put('sections', $sections);

    $this->from('/')->post('/contact', validMessage())->assertSessionHas('success', 'Got it, I will reply soon.');
});

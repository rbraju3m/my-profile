<?php

declare(strict_types=1);

use App\Models\Project;
use App\Models\User;
use Database\Seeders\PortfolioSeeder;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route as Router;
use PragmaRX\Google2FA\Google2FA;

beforeEach(fn () => $this->seed(PortfolioSeeder::class));

/** Every route under /admin except the guest-facing Fortify pages, with fake parameters filled in. */
function protectedAdminRoutes(): array
{
    $public = ['admin/login', 'admin/two-factor-challenge'];

    return collect(Router::getRoutes()->getRoutes())
        ->filter(fn (Route $r) => str_starts_with($r->uri(), 'admin') && ! in_array($r->uri(), $public, true))
        ->flatMap(fn (Route $r) => collect($r->methods())->reject(fn ($m) => $m === 'HEAD')
            ->map(fn ($m) => [$m, '/'.preg_replace('/\{[^}]+\}/', '1', $r->uri())]))
        ->values()
        ->all();
}

it('blocks guests from every admin route', function () {
    $routes = protectedAdminRoutes();
    expect(count($routes))->toBeGreaterThan(50);

    foreach ($routes as [$method, $uri]) {
        $response = $this->call($method, $uri);
        expect($response->getStatusCode())->toBeIn([302, 401, 404], "{$method} {$uri}");
        if ($response->getStatusCode() === 302) {
            expect($response->headers->get('Location'))->toEndWith('/admin/login', "{$method} {$uri}");
        }
    }

    // Nothing was changed on the way.
    expect(Project::query()->count())->toBe(20);
});

it('has no public registration or email password reset', function (string $uri) {
    $this->get($uri)->assertNotFound();
})->with(['/register', '/admin/register', '/forgot-password', '/admin/forgot-password', '/admin/reset-password/token']);

it('logs in with the right password and not with the wrong one', function () {
    $user = User::factory()->create(['email' => 'admin@example.com']);

    $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong'])->assertSessionHasErrors('email');
    $this->assertGuest();

    $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'password'])->assertRedirect();
    $this->assertAuthenticatedAs($user);
});

it('locks out repeated wrong passwords', function () {
    User::factory()->create(['email' => 'admin@example.com']);

    foreach (range(1, 5) as $i) {
        $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong'.$i]);
    }

    $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'password'])->assertStatus(429);
    $this->assertGuest();
});

it('asks for a TOTP code after the password when two-factor is on', function () {
    $google2fa = new Google2FA;
    $secret = $google2fa->generateSecretKey();
    $user = User::factory()->create(['email' => 'admin@example.com']);
    $user->forceFill([
        'two_factor_secret' => encrypt($secret),
        'two_factor_recovery_codes' => encrypt(json_encode(['recovery-one'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'password'])
        ->assertRedirect('/admin/two-factor-challenge');
    $this->assertGuest();

    $this->post('/admin/two-factor-challenge', ['code' => '000000'])->assertSessionHasErrors('code');
    $this->assertGuest();

    $this->post('/admin/two-factor-challenge', ['code' => $google2fa->getCurrentOtp($secret)])->assertRedirect();
    $this->assertAuthenticatedAs($user);
});

it('blocks writes, not only pages, until two-factor is confirmed', function () {
    config(['admin.require_two_factor' => true]);
    $admin = User::factory()->create();

    $this->actingAs($admin)->put('/admin/settings/footer', ['tagline' => 'Changed', 'copyright' => 'x'])->assertRedirect('/admin/account');
    $this->actingAs($admin)->delete('/admin/projects/orbito-erp')->assertRedirect('/admin/account');

    expect(Project::query()->where('slug', 'orbito-erp')->exists())->toBeTrue();
});

it('changes the password only with the current one', function () {
    config(['admin.require_two_factor' => false]);
    $admin = User::factory()->create();

    $this->actingAs($admin)->put('/admin/user/password', [
        'current_password' => 'wrong', 'password' => 'a-New-passw0rd!!', 'password_confirmation' => 'a-New-passw0rd!!',
    ])->assertSessionHasErrorsIn('updatePassword', 'current_password');

    $this->actingAs($admin)->put('/admin/user/password', [
        'current_password' => 'password', 'password' => 'a-New-passw0rd!!', 'password_confirmation' => 'a-New-passw0rd!!',
    ])->assertSessionHasNoErrors();

    expect(Hash::check('a-New-passw0rd!!', $admin->refresh()->password))->toBeTrue();
});

it('logs out', function () {
    $this->actingAs(User::factory()->create())->post('/admin/logout')->assertRedirect();
    $this->assertGuest();
});

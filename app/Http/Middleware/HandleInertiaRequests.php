<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\ContactMessage;
use App\Services\Settings;
use Illuminate\Http\Request;
use Inertia\Middleware;

final class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'site';

    /**
     * The admin panel is client-rendered: it is behind a login, so crawlers
     * never see it and server rendering would only cost CPU.
     *
     * @var list<string>
     */
    protected $withoutSsr = ['admin', 'admin/*'];

    public function __construct(private readonly Settings $settings) {}

    public function rootView(Request $request): string
    {
        return $request->is('admin', 'admin/*') ? 'admin' : 'site';
    }

    /** @return array<string, mixed> */
    public function share(Request $request): array
    {
        if ($request->is('admin', 'admin/*')) {
            return $this->shareAdmin($request);
        }

        $site = $this->settings->get('site');

        return [
            ...parent::share($request),

            'site' => [
                'name' => $site['name'] ?? '',
                'title' => $site['title'] ?? '',
                'role_line' => $site['role_line'] ?? '',
                'location' => $site['location'] ?? '',
                'socials' => $site['socials'] ?? [],
                'availability' => $site['availability'] ?? ['enabled' => false, 'text' => ''],
                'has_cv' => $this->settings->hasCv(),
                /*
                 * Email and phone travel encoded and are decoded in the browser
                 * after hydration, so they never appear as plain text in the
                 * HTML that simple scraping bots harvest.
                 */
                'contact' => [
                    'email' => $this->encode($site['email'] ?? null),
                    'phone' => $this->encode($site['phone'] ?? null),
                    'whatsapp' => $this->encode($site['whatsapp'] ?? null),
                ],
            ],
            'turnstileSiteKey' => config('services.turnstile.site_key') ?: null,
            'nav' => $this->settings->get('nav')['items'] ?? [],
            'footer' => $this->settings->get('footer'),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function shareAdmin(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => $user === null ? null : ['name' => $user->name, 'email' => $user->email],
            'unreadMessages' => fn () => $user === null ? 0 : ContactMessage::query()->where('status', 'new')->count(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'warning' => fn () => $request->session()->get('warning'),
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }

    private function encode(?string $value): ?string
    {
        return $value === null || $value === '' ? null : base64_encode(strrev($value));
    }
}

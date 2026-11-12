<?php

declare(strict_types=1);

namespace App\Actions;

use App\Mail\NewContactMessage;
use App\Models\ContactMessage;
use App\Services\Settings;
use Illuminate\Support\Facades\Mail;

/**
 * Stores a contact form message. Returns null when the honeypot was filled:
 * the bot still gets a success response, so it learns nothing.
 */
final class SubmitContactMessage
{
    public function __construct(private readonly Settings $settings) {}

    /** @param array{name: string, email: string, subject: string, message: string, website?: string|null} $data */
    public function handle(array $data, ?string $ip, ?string $userAgent): ?ContactMessage
    {
        if (! empty($data['website'])) {
            return null;
        }

        $message = ContactMessage::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'],
            'message' => $data['message'],
            'ip_hash' => $ip === null ? null : hash_hmac('sha256', $ip, (string) config('app.key')),
            'user_agent' => $userAgent === null ? null : mb_substr($userAgent, 0, 255),
            'status' => 'new',
        ]);

        $to = config('admin.contact_to') ?: ($this->settings->get('site')['email'] ?? null);
        if (is_string($to) && $to !== '') {
            // Queued: the visitor never waits on (or sees failures from) the mail provider.
            Mail::to($to)->queue(new NewContactMessage($message));
        }

        return $message;
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Site;

use App\Actions\SubmitContactMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Site\ContactMessageRequest;
use App\Services\Settings;
use Illuminate\Http\RedirectResponse;

final class ContactController extends Controller
{
    public function __invoke(ContactMessageRequest $request, SubmitContactMessage $submit, Settings $settings): RedirectResponse
    {
        /** @var array{name: string, email: string, subject: string, message: string, website?: string|null} $data */
        $data = $request->validated();

        $submit->handle($data, $request->ip(), $request->userAgent());

        return back()->with('success', (string) ($settings->get('sections')['contact']['success'] ?? 'Thank you, your message has been sent.'));
    }
}

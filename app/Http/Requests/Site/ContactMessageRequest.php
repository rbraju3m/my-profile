<?php

declare(strict_types=1);

namespace App\Http\Requests\Site;

use App\Services\Turnstile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class ContactMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'subject' => ['required', 'string', 'min:3', 'max:160'],
            'message' => ['required', 'string', 'min:20', 'max:5000'],
            // Honeypot: hidden from people, filled in by naive bots.
            'website' => ['nullable', 'string', 'max:255'],
            'cf-turnstile-response' => ['nullable', 'string', 'max:2048'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(Turnstile $turnstile): array
    {
        return [
            function (Validator $validator) use ($turnstile): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }
                if (! $turnstile->verify($this->string('cf-turnstile-response')->toString(), $this->ip())) {
                    $validator->errors()->add('form', 'We could not confirm you are human. Please try again.');
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'message.min' => 'Please write at least 20 characters so I know how to help.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Plain text only: trim, and strip any markup before it is validated or stored.
        $this->merge(collect($this->only(['name', 'email', 'subject', 'message']))
            ->map(fn ($value) => is_string($value) ? trim(strip_tags($value)) : $value)
            ->all());
    }
}

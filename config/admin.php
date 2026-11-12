<?php

declare(strict_types=1);

return [
    // Two-factor authentication is required for the admin unless explicitly disabled (local dev).
    'require_two_factor' => (bool) env('ADMIN_REQUIRE_2FA', true),

    // Where contact form notifications go. Falls back to the email in Site settings.
    'contact_to' => env('CONTACT_TO'),

    // Local development only (LocalAdminSeeder). Ignored outside APP_ENV=local.
    'local_admin' => [
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],
];

<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Local development only: creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
 * in .env. Production admins are created with `php artisan admin:user`.
 */
final class LocalAdminSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        $email = config('admin.local_admin.email');
        $password = config('admin.local_admin.password');

        if (! is_string($email) || $email === '' || ! is_string($password) || $password === '') {
            return;
        }

        User::query()->updateOrCreate(['email' => $email], ['name' => 'Admin', 'password' => $password]);
    }
}

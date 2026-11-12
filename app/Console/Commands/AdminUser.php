<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Fortify\PasswordValidationRules;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Creates the admin account, or resets its password. There is no public
 * registration and no email reset: this command is the only way in.
 */
final class AdminUser extends Command
{
    use PasswordValidationRules;

    protected $signature = 'admin:user {email? : Admin email} {--name= : Display name}';

    protected $description = 'Create the admin user or reset its password (also clears two-factor if asked)';

    public function handle(): int
    {
        $email = $this->argument('email') ?? text('Admin email', required: true);
        $secret = password('Password (min 12 characters)', required: true);

        $validator = Validator::make(
            ['email' => $email, 'password' => $secret],
            ['email' => ['required', 'email'], 'password' => ['required', 'string', 'min:12']],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->name = $this->option('name') ?: ($user->name ?? 'Admin');
        $user->password = $secret;
        $created = ! $user->exists;
        $user->save();

        if (! $created && $user->two_factor_secret !== null && $this->confirm('Also turn off two-factor authentication (lost device)?', false)) {
            $user->forceFill(['two_factor_secret' => null, 'two_factor_recovery_codes' => null, 'two_factor_confirmed_at' => null])->save();
        }

        $this->info($created ? "Admin {$email} created." : "Password for {$email} updated.");

        return self::SUCCESS;
    }
}

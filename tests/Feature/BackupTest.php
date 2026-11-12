<?php

declare(strict_types=1);

use App\Models\Project;
use Database\Seeders\PortfolioSeeder;
use Illuminate\Support\Facades\Storage;

/** Writes a fake backup zip, the way spatie/laravel-backup lays it out. */
function fakeBackup(string $disk, array $entries, ?string $password = null, string $file = '2026-11-13-02-00-00.zip'): void
{
    $tmp = tempnam(sys_get_temp_dir(), 'bk');
    $zip = new ZipArchive;
    $zip->open($tmp, ZipArchive::OVERWRITE);
    foreach ($entries as $name => $content) {
        $zip->addFromString($name, $content);
        if ($password !== null) {
            $zip->setEncryptionName($name, ZipArchive::EM_AES_256, $password);
        }
    }
    $zip->close();

    Storage::disk($disk)->put(config('backup.backup.name').'/'.$file, (string) file_get_contents($tmp));
    unlink($tmp);
}

const GOOD_DUMP = "CREATE TABLE `projects` (id int);\nINSERT INTO `projects` VALUES (1);\n";

beforeEach(function () {
    Storage::fake('backups');
    config(['backup.backup.destination.disks' => ['backups'], 'backup.backup.password' => null]);
});

it('backs up only the uploads, keeps 30 days, and stores locally until R2 is configured', function () {
    expect(config('backup.backup.source.files.include'))->toBe([storage_path('app/public')])
        ->and(config('backup.cleanup.default_strategy.keep_daily_backups_for_days'))->toBe(30)
        ->and(config('filesystems.disks.r2.driver'))->toBe('s3')
        ->and(config('backup.notifications.mail.to'))->toBeString()->not->toBe('');
});

it('passes a recent backup with a database dump and uploads', function () {
    fakeBackup('backups', ['db-dumps/mysql-portfolio.sql' => GOOD_DUMP, 'storage/app/public/1/cv.pdf' => '%PDF']);

    $this->artisan('backup:verify', ['--no-restore' => true])
        ->expectsOutputToContain('OK: '.config('backup.backup.name').'/2026-11-13-02-00-00.zip')
        ->assertSuccessful();
});

it('opens a password-protected backup with the archive password', function () {
    config(['backup.backup.password' => 'secret-pass']);
    fakeBackup('backups', ['db-dumps/mysql-portfolio.sql' => GOOD_DUMP], password: 'secret-pass');

    $this->artisan('backup:verify', ['--no-restore' => true])->assertSuccessful();

    config(['backup.backup.password' => 'wrong']);
    $this->artisan('backup:verify', ['--no-restore' => true])->assertFailed();
});

it('fails when there is no backup, it is too old, or it has no usable dump', function (Closure $arrange) {
    $arrange();

    $this->artisan('backup:verify', ['--no-restore' => true])->assertFailed();
})->with([
    'no backups' => [fn () => null],
    'no dump' => [fn () => fakeBackup('backups', ['storage/app/public/a.png' => 'x'])],
    'empty dump' => [fn () => fakeBackup('backups', ['db-dumps/mysql-portfolio.sql' => '-- nothing'])],
    'too old' => [function () {
        fakeBackup('backups', ['db-dumps/mysql-portfolio.sql' => GOOD_DUMP]);
        $path = Storage::disk('backups')->path(config('backup.backup.name').'/2026-11-13-02-00-00.zip');
        touch($path, time() - 5 * 86400);
    }],
]);

it('schedules the daily backup and the monthly restore check', function () {
    $this->artisan('schedule:list')
        ->expectsOutputToContain('backup:run')
        ->expectsOutputToContain('backup:clean')
        ->expectsOutputToContain('backup:monitor')
        ->expectsOutputToContain('backup:verify')
        ->assertSuccessful();
});

it('refuses to re-seed a production site that already has content', function () {
    $this->seed(PortfolioSeeder::class);
    Project::query()->where('slug', 'orbito-erp')->update(['title' => 'Edited in the admin']);
    app()->detectEnvironment(fn () => 'production');

    expect(fn () => app(PortfolioSeeder::class)->setContainer(app())->__invoke())->toThrow(RuntimeException::class, 'overwrite admin edits');
    expect(Project::query()->where('slug', 'orbito-erp')->value('title'))->toBe('Edited in the admin');
});

it('re-seeds production only when explicitly asked for that one command', function () {
    $this->seed(PortfolioSeeder::class);
    Project::query()->where('slug', 'orbito-erp')->update(['title' => 'Edited in the admin']);
    app()->detectEnvironment(fn () => 'production');

    putenv('PORTFOLIO_SEED_OVERWRITE=1');
    try {
        app(PortfolioSeeder::class)->setContainer(app())->__invoke();
    } finally {
        putenv('PORTFOLIO_SEED_OVERWRITE');
    }

    expect(Project::query()->where('slug', 'orbito-erp')->value('title'))->toBe('Orbito ERP');
});

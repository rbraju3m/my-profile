<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

/**
 * The monthly restore test. For each backup destination it takes the newest
 * backup, opens it (with the archive password), checks it holds a database
 * dump and the uploads, and, on MySQL, restores the dump into a scratch
 * database and compares row counts with the live one. Exits non-zero (and the
 * scheduler emails) when anything is wrong.
 */
final class VerifyBackup extends Command
{
    protected $signature = 'backup:verify {--max-age=2 : Fail if the newest backup is older than this many days} {--no-restore : Only inspect the archive}';

    protected $description = 'Check that the newest backup on every destination exists, opens and restores';

    /** Tables whose row counts must survive a restore. */
    private const TABLES = ['settings', 'projects', 'technologies', 'experiences', 'diagrams', 'users'];

    public function handle(): int
    {
        /** @var list<string> $disks */
        $disks = config('backup.backup.destination.disks');
        $name = (string) config('backup.backup.name');
        $failures = 0;

        foreach ($disks as $disk) {
            try {
                $this->verify($disk, $name);
            } catch (RuntimeException $e) {
                $failures++;
                $this->error("[{$disk}] {$e->getMessage()}");
            }
        }

        return $failures === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function verify(string $disk, string $name): void
    {
        $storage = Storage::disk($disk);
        $zips = collect($storage->files($name))->filter(fn (string $f) => str_ends_with($f, '.zip'));
        $newest = $zips->sortByDesc(fn (string $f) => $storage->lastModified($f))->first();

        if ($newest === null) {
            throw new RuntimeException('No backups found.');
        }

        $ageDays = (time() - $storage->lastModified($newest)) / 86400;
        if ($ageDays > (float) $this->option('max-age')) {
            throw new RuntimeException(sprintf('Newest backup %s is %.1f days old.', $newest, $ageDays));
        }

        $workdir = storage_path('app/restore-check/'.uniqid());
        @mkdir($workdir, 0700, true);

        try {
            $zipPath = "{$workdir}/backup.zip";
            $stream = $storage->readStream($newest) ?? throw new RuntimeException("Cannot read {$newest}.");
            file_put_contents($zipPath, $stream);

            $zip = new ZipArchive;
            if ($zip->open($zipPath) !== true) {
                throw new RuntimeException("{$newest} is not a readable zip.");
            }
            $password = config('backup.backup.password');
            if (is_string($password) && $password !== '') {
                $zip->setPassword($password);
            }

            $dumps = [];
            $uploads = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = (string) $zip->getNameIndex($i);
                if (str_starts_with($entry, 'db-dumps/') && str_ends_with($entry, '.sql')) {
                    $dumps[] = $entry;
                } elseif (str_contains($entry, 'app/public/') && ! str_ends_with($entry, '/')) {
                    $uploads++;
                }
            }

            if ($dumps === []) {
                throw new RuntimeException("{$newest} has no database dump.");
            }
            if (! $zip->extractTo($workdir, $dumps)) {
                throw new RuntimeException("Could not extract the dump from {$newest} (wrong BACKUP_ARCHIVE_PASSWORD?).");
            }
            $zip->close();

            $dump = "{$workdir}/{$dumps[0]}";
            $sql = (string) file_get_contents($dump, length: 1_000_000);
            if (! str_contains($sql, 'CREATE TABLE') || ! str_contains($sql, 'projects')) {
                throw new RuntimeException('The database dump is empty or incomplete.');
            }

            $restored = ! $this->option('no-restore') && DB::connection()->getDriverName() === 'mysql'
                ? $this->restoreAndCompare($dump)
                : 'not restored (only MySQL dumps are test-restored)';

            $this->info(sprintf('[%s] OK: %s (%.1f days old), %d uploaded files, database %s.', $disk, $newest, $ageDays, $uploads, $restored));
        } finally {
            Process::run(['rm', '-rf', $workdir]);
        }
    }

    /** Restores the dump into a scratch database and compares row counts with the live database. */
    private function restoreAndCompare(string $dump): string
    {
        /** @var array<string, mixed> $config */
        $config = DB::connection()->getConfig();
        $live = (string) $config['database'];
        $scratch = $live.'_restore_check';
        $env = ['MYSQL_PWD' => (string) ($config['password'] ?? '')];
        $base = ['mysql', '--host='.$config['host'], '--port='.$config['port'], '--user='.$config['username']];

        $run = function (array $args, ?string $input = null) use ($env): void {
            $process = Process::env($env)->timeout(600);
            $result = $input === null ? $process->run($args) : $process->input($input)->run($args);
            if ($result->failed()) {
                throw new RuntimeException('MySQL restore failed: '.trim($result->errorOutput()));
            }
        };

        $run([...$base, '-e', "DROP DATABASE IF EXISTS `{$scratch}`; CREATE DATABASE `{$scratch}`"]);

        try {
            $run([...$base, $scratch], (string) file_get_contents($dump));

            $problems = [];
            foreach (self::TABLES as $table) {
                $restoredCount = (int) (DB::selectOne("SELECT COUNT(*) AS c FROM `{$scratch}`.`{$table}`")->c ?? 0);
                $liveCount = (int) (DB::selectOne("SELECT COUNT(*) AS c FROM `{$live}`.`{$table}`")->c ?? 0);
                // A day of admin edits may differ; an empty table that is not empty live is a broken backup.
                if ($liveCount > 0 && $restoredCount === 0) {
                    $problems[] = "{$table}: restored 0 rows, live has {$liveCount}";
                }
            }
            if ($problems !== []) {
                throw new RuntimeException('Restore incomplete: '.implode('; ', $problems));
            }

            return 'restored and checked ('.implode(', ', self::TABLES).')';
        } finally {
            $run([...$base, '-e', "DROP DATABASE IF EXISTS `{$scratch}`"]);
        }
    }
}

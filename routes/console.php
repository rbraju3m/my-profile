<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

/*
 * Production schedule. Forge runs `php artisan schedule:run` every minute.
 * Problems are emailed to BACKUP_NOTIFY_EMAIL (spatie/laravel-backup for the
 * backup tasks; the scheduler for the restore check).
 */
// From config, not env(): env() returns null once the config is cached in production.
$notify = (string) config('backup.notifications.mail.to');

// Daily backup of the database and uploads, then retention (30 days of dailies).
Schedule::command('backup:clean')->dailyAt('01:30')->onOneServer();
Schedule::command('backup:run')->dailyAt('02:00')->onOneServer();
Schedule::command('backup:monitor')->dailyAt('03:00');

// The monthly restore test.
Schedule::command('backup:verify')->monthlyOn(1, '04:00')->onOneServer()->emailOutputOnFailure($notify);

// Housekeeping.
Schedule::command('queue:prune-failed --hours=720')->weekly();
Schedule::command('activitylog:clean')->monthly();

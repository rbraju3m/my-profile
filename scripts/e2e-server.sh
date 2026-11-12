#!/usr/bin/env bash
# Starts the built site the way the browser tests and Lighthouse see it:
# PHP's built-in server on :8124 plus the SSR server on :13715, with a fresh
# seeded SQLite database. Run `npm run build` first. Ctrl+C stops both.
set -euo pipefail
cd "$(dirname "$0")/.."

export APP_ENV=local APP_DEBUG=false APP_URL=http://127.0.0.1:8124 \
    DB_CONNECTION=sqlite DB_DATABASE="$PWD/database/e2e.sqlite" \
    SESSION_DRIVER=file CACHE_STORE=array QUEUE_CONNECTION=sync MAIL_MAILER=array \
    RESPONSE_CACHE_ENABLED=true CACHE_FILE_PATH="$PWD/storage/framework/cache/e2e" ADMIN_REQUIRE_2FA=false TURNSTILE_SITE_KEY= TURNSTILE_SECRET_KEY= \
    INERTIA_SSR_PORT=13715 INERTIA_SSR_URL=http://127.0.0.1:13715 PHP_CLI_SERVER_WORKERS=4

touch "$DB_DATABASE"
php artisan migrate:fresh --seed --force --no-interaction >/dev/null
php artisan responsecache:clear >/dev/null

node bootstrap/ssr/ssr.js &
SSR_PID=$!
trap 'kill $SSR_PID 2>/dev/null || true' EXIT

cd public
php -S 127.0.0.1:8124 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php 2>/dev/null

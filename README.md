# my-profile

Rashedul Raju's portfolio site (`rashedulraju.dev`): a Laravel 13 app with an Inertia + React public site and a React + Mantine admin panel at `/admin`.

## Running locally

Run all commands from the project root.

### First-time setup (new machine only)

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before seeding. Locally, the seeder creates the admin user from them.

### Option A: development (changes show up as you edit)

Run each command in its own terminal:

```bash
php artisan serve --port=8123     # 1. the Laravel app
npm run dev                       # 2. Vite dev server (live reload)
php artisan queue:work            # 3. optional: contact-form emails and image conversions
```

### Option B: production-like build (with server-side rendering)

```bash
npm run build                     # builds the client and SSR bundles
php artisan inertia:start-ssr     # SSR server on :13714 (without it the site still works, just client-rendered)
php artisan serve --port=8123
php artisan queue:work            # optional
```

### Open

- **Site:** http://127.0.0.1:8123
- **Admin:** http://127.0.0.1:8123/admin. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. Two-factor login is turned off locally when `ADMIN_REQUIRE_2FA=false`.

### Useful extras

```bash
php artisan migrate:fresh --seed  # reset the database to the initial content (this deletes admin edits)
php artisan admin:user            # create the admin user or reset its password
```

**If you get `npm: command not found`:** Node comes from nvm, so run `nvm use` or `export PATH=~/.nvm/versions/node/v24.22.1/bin:$PATH` first.

## More

- Tests, linting and architecture: see `CLAUDE.md`.
- Testing results: `docs/phase-5-testing.md`.
- Production deployment: `docs/phase-6-launch.md`.

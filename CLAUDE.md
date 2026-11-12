# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Rashedul Raju's portfolio site (`rashedulraju.dev`). It is one Laravel 13 app: a server-rendered Inertia 3 + React 19 public site, plus a custom React + Mantine admin panel at `/admin`. The project runs in phases, and the user approves each phase before the next one starts. The plan is in `docs/phase-2-plan.md` and the verified facts are in `docs/phase-1-discovery.md`.

## Commands

```bash
composer install && npm install
php artisan migrate:fresh --seed     # SQLite locally (database/database.sqlite); MySQL 8 in production
npm run build                        # client bundle + SSR bundle (bootstrap/ssr/ssr.js)
php artisan inertia:start-ssr        # SSR server on :13714 (without it, pages fall back to client rendering)
php artisan serve --port=8123
php artisan queue:work               # contact emails and image conversions (database queue)
php artisan admin:user               # create the admin / reset its password (no public registration)
npm run dev                          # Vite dev server instead of build

vendor/bin/pest                      # backend tests
vendor/bin/pest --filter="contact"   # single test by name
vendor/bin/phpstan analyse --memory-limit=1G   # Larastan level 6
vendor/bin/pint                      # PHP style
npm test                             # Vitest
npx vitest run resources/js/site/lib/filterProjects.test.ts   # single file
npm run typecheck && npm run lint

npm run build && npm run e2e         # Playwright: 6 browser/screen setups, light+dark, axe; own DB (database/e2e.sqlite), :8124, SSR :13715
npx playwright test e2e/public.spec.ts --project=chromium-desktop   # one file, one browser
CHROME_PATH=... npm run lighthouse   # Lighthouse CI budgets (lighthouserc.cjs)
scripts/e2e-server.sh                # the e2e/Lighthouse server by hand
```

CI (`.github/workflows/ci.yml`) runs Pint, Larastan, Pest, tsc, ESLint, Vitest and the build, checks that no test code is in the bundles, then a `browser` job runs Playwright and Lighthouse. Phase 5 results: `docs/phase-5-testing.md`.

Test files (`*.test.tsx`) may sit next to pages: the page globs in `site/app.tsx`, `site/ssr.tsx` and `admin/app.tsx` exclude them. Keep that exclusion in any new glob.

TypeScript is pinned to `~6.0` because typescript-eslint does not support TS 7.

## Architecture

**Content is never hard-coded.** Every word, project, skill and diagram comes from the database so it can be edited in the admin:
- `settings` table: one JSON row per group (`site`, `hero`, `about`, `seo`, `nav`, `sections`, `footer`), read through the cached `App\Services\Settings`. The CV is a medialibrary file on the `site` settings row.
- Content tables: `projects`, `technologies` (these drive both the skill cards and the project filters), `skill_categories`, `experiences`, `education`, `specializations`, `diagrams` and `contact_messages`.
- `database/seeders/data/portfolio.php` is the verified initial content. Since the admin exists, the database is the source of truth.
- Locally, `LocalAdminSeeder` creates an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (APP_ENV=local only).

**Content accuracy rule.** Every project has a `status` (`live` / `built` / `in_development` / `research`), and an optional `status_note`. Never present built or researched work as live. Before changing a claim, check it against `docs/phase-1-discovery.md`.

**Request flow:**
1. `App\Http\Controllers\Site\*` call `App\Services\PortfolioQuery`. It shapes models into plain arrays, applying only-published and the `show_client` switch, so the pages never get hidden data.
2. `HandleInertiaRequests` shares `site`, `nav`, `footer` and `flash`. The email and phone are shared base64-encoded and reversed, and decoded in the browser by `useDecoded`, so they never appear in the HTML.
3. SEO tags and JSON-LD are written by the Blade root view (`resources/views/site.blade.php`) from `App\Support\Seo`, not by React. That way crawlers get them even if SSR is down. React's `<Head>` only renders client-side, to keep the title current during Inertia navigation; it renders nothing on the server, which avoids duplicate tags.

**Pages** live in one tree, `resources/js/pages/{Site,Admin}`, with Inertia component names `Site/...` and `Admin/...`. Each Vite entry globs only its own half, so the site bundle never contains admin code.

**Frontend:**
- `resources/js/site/` is the public bundle: Tailwind 4, design tokens as CSS variables in `resources/css/site.css`, and dark mode via a `.dark` class set by a pre-paint script (which also adds `.js`). Keep this bundle lean: scroll reveals are CSS (`[data-reveal]`), and contact validation is the hand-written `validateContact` (no animation or schema libraries).
- The home page hydrates progressively: sections below the fold are wrapped in `<Deferred>` (`site/components/Deferred.tsx`) and hydrate near the viewport, and `app.tsx` hydrates inside `startTransition`. Wrap one section element per `<Deferred>` and give it plain JSON props: `Deferred` compares props to skip Inertia's identical re-render, because any re-render of a section that isn't hydrated yet discards its server HTML. Never defer a section with form inputs, since text typed before hydration would be lost.
- Public error pages (404, 500, ...) are `Site/Error`, rendered by `App\Support\SiteErrorPage` from `bootstrap/app.php`. It uses no shared props, since it can run before any middleware.
- `resources/js/shared/types.ts` mirrors the PHP prop shapes.
- Diagrams are data (nodes on a column/row grid, plus edges). `components/diagrams/layout.ts` is a pure, tested router. `FlowDiagram` draws SVG on `lg+` screens and a step list below that.
- `resources/js/admin/` is the admin bundle: Mantine 9, TipTap and dnd-kit. `/admin/*` is client-rendered: it is excluded from SSR, and its root view (`admin.blade.php`) is chosen in `HandleInertiaRequests::rootView`. The diagram editor's live preview reuses the site's `FlowDiagram`, styled through `resources/css/admin-preview.css`, which loads Tailwind utilities without preflight, scoped to `.site-preview`.

**Admin** (`routes/admin.php`, `App\Http\Controllers\Admin\*`):
- Fortify (`config/fortify.php`, prefix `admin`) handles login, two-factor (TOTP) and password change. There is no registration and no email password reset.
- `RequireTwoFactor` blocks everything except `/admin/account` until 2FA is confirmed. `ADMIN_REQUIRE_2FA=false` turns this off for local development.
- Validation rules for each settings group are in `App\Admin\SettingsSchema`. Every link is checked against `SAFE_HREF`.
- Rich text is cleaned by `App\Support\RichText`.
- Drag-and-drop ordering goes through `ReorderController`.
- Content models use `LogsContentChanges`, which feeds the activity log on the dashboard.

**Caching:**
- Public GET routes use the `page-cache` middleware (spatie/laravel-responsecache) with `App\Http\Cache\PublicPageCacheProfile`. It caches only anonymous full-page loads; Inertia JSON, `/admin`, signed-in users and flashed responses are never cached.
- `FlushPublicCache` clears the cache, and the cached Settings, after every successful admin write.
- `SecurityHeaders` sets the CSP with a per-request nonce. `CspNonceReplacer` swaps that nonce into cached HTML.
- Session and XSRF cookies are issued fresh on every response, cached or not, so CSRF stays on for the contact form.

**Contact form:**
1. `POST /contact` goes through `ContactMessageRequest`, which strips markup. Its `after()` hook verifies Turnstile; the check is skipped when `TURNSTILE_*` keys are empty.
2. `SubmitContactMessage` then runs. If the honeypot field is filled, the message is discarded but the sender still sees success. Otherwise it is saved and `NewContactMessage` is queued, with reply-to set to the sender.
3. The `contact` rate limiter allows 5 per hour and 20 per day per IP.

**Production** (Phase 6, `docs/phase-6-launch.md`): Hetzner + Laravel Forge (zero-downtime releases), Cloudflare in front (proxied, Full strict), Resend SMTP.
- `deploy/` holds the Forge deploy script, the production `.env` template, the Nginx snippet (Cloudflare real IP: the contact rate limit depends on it), the hardening recipe and `rollback.sh`.
- The SSR bundle is self-contained (`ssr.noExternal: true`, NODE_ENV pinned at build), because releases delete `node_modules`. Don't externalise SSR dependencies.
- Backups: `spatie/laravel-backup` (disks from `BACKUP_DISKS`: `backups` locally on the server, `r2` offsite) and `php artisan backup:verify` (monthly restore test), scheduled in `routes/console.php`. Never use `env()` outside `config/`, because it returns null with cached config.
- `PortfolioSeeder` refuses to run in production once content exists (it would overwrite admin edits).
- Migrations must stay forward-only and additive, so `rollback.sh` can switch back to older code.

**SEO files:** `/sitemap.xml` and `/robots.txt` are generated by `SeoFilesController`. robots.txt disallows everything outside production.

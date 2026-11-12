# Phase 6: Launch runbook

Prepared 13 Nov 2026. Stack (your choices): **Hetzner** server, managed by **Laravel Forge** with zero-downtime deploys, domain and DNS on **Cloudflare**, email through **Resend**. R2 backups and Turnstile can be added later; the site runs safely without them.

Nothing here has been done to a live service yet. Each step says who does it:
- 👤 **you**: steps in a dashboard (Hetzner, Forge, Cloudflare, Resend).
- 💻 **command**: something run on the server, through Forge's "Commands" tab or SSH. I can walk you through these, or run them over SSH once you give me access and the go-ahead.

Files used: `deploy/forge-deploy.sh`, `deploy/env.production.example`, `deploy/nginx-cloudflare.conf`, `deploy/hardening-recipe.sh`, `deploy/rollback.sh`.

---

## What was prepared in the code (done)

| Item | What it does |
|---|---|
| **Backups** (`spatie/laravel-backup`) | The database and uploads (images, CV), daily at 02:00, in an encrypted zip. All dailies are kept for 30 days, then weeklies. Failures are emailed. Stored on the server until R2 exists; then on both. |
| **Monthly restore test** (`php artisan backup:verify`) | Opens the newest backup with the archive password and checks it holds a dump and the uploads. On MySQL it restores the dump into a scratch database and compares row counts. Emails you if anything is wrong. |
| **Scheduler** (`routes/console.php`) | Backup, cleanup, monitoring, the restore test, and pruning old failed jobs and the activity log. |
| **Re-seed guard** | `db:seed` in production refuses to run once the site has content, because it would overwrite your admin edits. |
| **Self-contained SSR bundle** | `bootstrap/ssr/ssr.js` includes all its dependencies and always runs React's production build, so releases need no `node_modules` (about 400 MB saved per release). CI checks this. |
| **MySQL 8 in CI** | The full Pest suite also runs against MySQL 8, the production engine. |
| **Deploy rehearsal** | A clean copy was built with `composer --no-dev`, `node_modules` was deleted, and the site was served with the production `.env`. Every page was server-rendered, robots.txt and the 404 were in production form, and re-seeding was refused. |

---

## 1. Before you start
1. 👤 **Push `main` to GitHub** (it's ahead of `origin/main`). CI runs all checks, including the browser tests and MySQL.
2. 👤 Have ready:
   - a password manager entry for the **backup archive password** and the **admin password**
   - an authenticator app for the admin 2FA

## 2. Server (Hetzner + Forge), about 15 minutes
1. 👤 **Hetzner Cloud:** create a project and an **API token** (Read & Write).
2. 👤 **Forge** → Servers → Create server → **Hetzner**, paste the token, then choose:
   - **Type:** App server · **OS:** Ubuntu 24.04 · **PHP 8.4** · **Database:** MySQL 8, with database name `rashedulraju`
   - **Size:** a plan with **4 GB RAM** (for example CX22/CX23, about €4–8 a month). 2 GB is too tight for `npm run build` alongside MySQL.
   - **Location:** Germany or Finland is cheapest. Singapore gives lower latency to Bangladesh; Cloudflare caches the static files either way.
3. 👤 Save the **sudo and database passwords** that Forge shows.
4. 👤 Forge → Server → **Recipes** → new recipe from `deploy/hardening-recipe.sh`, run as **root**. It sets up fail2ban for SSH, key-only SSH and automatic security updates, then prints the firewall status.

## 3. Site, about 10 minutes
1. 👤 Forge → Server → **New site**:
   - **Domain:** `rashedulraju.dev` · **Aliases:** `www.rashedulraju.dev`
   - **Project:** Laravel, web directory `/public`, PHP 8.4
   - **Zero-downtime deployments:** **ON**
   - **Repository:** `rbraju3m/my-profile`, branch `main`. Don't install Composer dependencies yet.
2. 👤 Site → **Environment:** paste `deploy/env.production.example` and fill every `<...>` value:
   - `DB_PASSWORD`: from Forge
   - `MAIL_PASSWORD`: your Resend API key (step 6)
   - `BACKUP_ARCHIVE_PASSWORD`: a long random string, also saved in your password manager
   - `BACKUP_NOTIFY_EMAIL`: your email
   - Keep the `APP_KEY` that Forge generated.
3. 👤 Site → **Deployments** → deploy script: paste `deploy/forge-deploy.sh`. Compare it with Forge's default script and keep its `$CREATE_RELEASE()` / `$ACTIVATE_RELEASE()` lines exactly as Forge writes them.
4. 👤 Site → **Nginx configuration:** paste `deploy/nginx-cloudflare.conf` inside the `server { listen 443 ... }` block, above `location /`. It provides real visitor IPs behind Cloudflare (otherwise the contact rate limit would be shared by every visitor), long caching for built assets, and blocks dotfiles.
5. 👤 Server → **Daemons** (Supervisor), user `forge`:

   | Command | Directory |
   |---|---|
   | `php8.4 artisan queue:work database --sleep=3 --tries=3 --max-time=3600 --timeout=120` | `/home/forge/rashedulraju.dev/current` |
   | `php8.4 artisan inertia:start-ssr` | `/home/forge/rashedulraju.dev/current` |

6. 👤 Server → **Scheduler:** `php8.4 /home/forge/rashedulraju.dev/current/artisan schedule:run`, every minute.

## 4. HTTPS and DNS (Cloudflare), about 10 minutes
1. 👤 Cloudflare → SSL/TLS → **Origin Server** → Create certificate for `rashedulraju.dev, *.rashedulraju.dev` (RSA, 15 years). In Forge → Site → SSL → **Install existing certificate**, paste the certificate and the key.
2. 👤 Cloudflare → **DNS:**

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | A | `@` | server IPv4 | Proxied 🟠 |
   | AAAA | `@` | server IPv6 | Proxied 🟠 |
   | CNAME | `www` | `rashedulraju.dev` | Proxied 🟠 |

3. 👤 Cloudflare settings:
   - **SSL/TLS → Full (strict)**
   - **Always Use HTTPS:** on
   - **Rules → Redirect rule:** `www.rashedulraju.dev/*` → `https://rashedulraju.dev/${1}`, 301
   - **Speed → Rocket Loader: OFF.** It rewrites scripts, which breaks the CSP nonce and React hydration.
   - **Scrape Shield → Email Address Obfuscation: OFF.** It rewrites HTML, which causes hydration mismatches.
   - Leave HTML uncached (the default). The app has its own page cache, and the admin and forms must not be cached at the edge.

## 5. First deploy and content, about 10 minutes
1. 👤 Forge → **Deploy now**. The script ends with a smoke test against the server itself, which works before DNS has propagated.
2. 💻 Load the verified content, **once only**: `php artisan db:seed --class=PortfolioSeeder --force`
3. 💻 Create your admin account: `php artisan admin:user you@example.com`. It asks for a password of 12+ characters.
4. 👤 Open `https://rashedulraju.dev/admin`:
   - log in
   - set up **two-factor** (the admin is locked until you do)
   - upload the **CV**
   - check the content
5. 💻 First backup and restore check:
   - `php artisan backup:run`
   - then `php artisan backup:verify`, which should report OK and show "restored and checked"

## 6. Email (Resend), about 10 minutes plus DNS time
1. 👤 Resend → Domains → **Add** `rashedulraju.dev`. Add the records it lists in Cloudflare DNS: the DKIM `resend._domainkey` TXT and the `send` MX and SPF TXT. Set them to **DNS only**; TXT and MX can't be proxied anyway.
2. 👤 Add DMARC: TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:<your email>`. After 2–4 weeks of clean reports, change it to `p=quarantine`.
3. 👤 Resend → API keys → create one with **Sending access**, limited to this domain. Put it in `MAIL_PASSWORD` and redeploy.
4. 👤 Send yourself a message through the contact form, then check:
   - it arrives
   - **Reply** goes to the sender
   - Gmail → "Show original" shows SPF, DKIM and DMARC = PASS
5. *(Optional)* Cloudflare **Email Routing**: forward `hello@rashedulraju.dev` to your inbox, so replies to that address reach you.

## 7. Go-live checks (I can run these from here once DNS is live, read-only)
- `https://rashedulraju.dev`, `/projects` and a case study load, are server-rendered and show no console errors.
- `http://` and `www.` redirect to `https://rashedulraju.dev`.
- Security headers are in place (CSP, HSTS, X-Frame-Options), checked with securityheaders.com.
- `robots.txt` allows crawling (production form); `/sitemap.xml` lists the published projects.
- `/admin` requires login, then 2FA.
- Lighthouse runs against the live URL.
- 👤 Google **Search Console**: verify through the Cloudflare DNS TXT record, then submit `https://rashedulraju.dev/sitemap.xml`.
- 👤 Uptime monitor (free tier of Better Stack or UptimeRobot) on `https://rashedulraju.dev/up`, alerting by email.

## 8. Later (the site is safe without these)
- **Turnstile:** Cloudflare → Turnstile → Add site `rashedulraju.dev`, Managed mode. Put the keys in `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` and redeploy. The form then shows the check automatically.
- **R2 offsite backups:**
  1. Cloudflare → R2 → create bucket `rashedulraju-backups`.
  2. Create an API token with Object Read & Write on that bucket only.
  3. Fill in the `R2_*` values, set `BACKUP_DISKS=backups,r2`, and redeploy.
  4. Run `php artisan backup:run && php artisan backup:verify`.

  Until then, backups live only on the server. A lost server means lost uploads and messages, though all the content can be re-entered from the seed data.

---

## Operating the site

**Deploy:** push to `main`, then Forge → Deploy now, or turn on Quick Deploy after CI passes. A failed step means the switch never happens and the live site is untouched.

**Roll back:** `ssh forge@<server> 'bash -s' < deploy/rollback.sh`. It switches `current` back to the previous release atomically, then clears caches and restarts the queue and SSR.
- Migrations are forward-only and additive, so older code runs on the newer schema.
- If a migration must be undone, run `php artisan migrate:rollback --step=1` in the newer release **before** rolling back.

**Restore from backup:**
1. Download the zip (from `storage/app/backups/Rashedul Raju/` or R2).
2. Unzip it with the archive password.
3. Run `mysql rashedulraju < db-dumps/mysql-rashedulraju.sql`.
4. Copy `storage/app/public/` back into `/home/forge/rashedulraju.dev/storage/app/public/`.
5. Run `php artisan responsecache:clear`.

The monthly `backup:verify` proves this works.

**Never run in production:** `migrate:fresh`, `migrate:reset`, `db:wipe`. The seeder refuses to run once content exists.

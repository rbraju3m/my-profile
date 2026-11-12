# Forge deploy script for rashedulraju.dev (zero-downtime deployments ON).
# Paste into Forge → Site → Deployments → Deploy Script.
#
# Forge creates a new release folder, links the shared .env and storage/,
# runs this script inside it ($FORGE_RELEASE_DIRECTORY), then switches the
# `current` symlink. If any command fails, the switch never happens and the
# live site keeps running the previous release.
#
# $CREATE_RELEASE() and $ACTIVATE_RELEASE() are Forge macros: keep them exactly
# as they appear in the default script Forge shows for this site.
set -e

$CREATE_RELEASE()

cd $FORGE_RELEASE_DIRECTORY

# PHP dependencies (no dev tools in production).
$FORGE_COMPOSER install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Front end: client bundle + SSR bundle (bootstrap/ssr/ssr.js).
npm ci --no-audit --no-fund
npm run build
rm -rf node_modules   # the SSR bundle is self-contained; saves ~400 MB per release

# Database: forward-only migrations. Never `migrate:fresh` or `db:seed` here.
$FORGE_PHP artisan migrate --force

# Production caches (config, routes, views, events) and the public storage link.
$FORGE_PHP artisan optimize
$FORGE_PHP artisan storage:link --force

$ACTIVATE_RELEASE()

# After the switch: cached pages point at the old asset hashes, so drop them;
# then restart the queue worker and SSR server so they load the new code
# (Supervisor restarts both inside the new `current`).
cd $FORGE_SITE_PATH/current
$FORGE_PHP artisan responsecache:clear
$FORGE_PHP artisan queue:restart
$FORGE_PHP artisan inertia:stop-ssr || true

# Smoke test against this server directly (works before DNS points here; -k
# because the Cloudflare origin certificate is not publicly trusted). A failure
# marks the deployment failed in Forge and emails you: then run deploy/rollback.sh.
sleep 3
ORIGIN="--resolve rashedulraju.dev:443:127.0.0.1 -k -fsS --max-time 10"
curl $ORIGIN -o /dev/null https://rashedulraju.dev/up
curl $ORIGIN https://rashedulraju.dev/ | grep -q 'data-server-rendered'

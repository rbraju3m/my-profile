#!/usr/bin/env bash
# Switch the live site back to the previous release (Forge zero-downtime layout:
# ~/rashedulraju.dev/{current -> releases/<id>, releases/*}).
#
#   ssh forge@<server> 'bash -s' < deploy/rollback.sh            # previous release
#   ssh forge@<server> 'bash -s' < deploy/rollback.sh <release>  # a specific one
#
# Database: migrations are forward-only and additive by policy, so the old
# code runs on the new schema. If a release's migration must be undone, run
# `php artisan migrate:rollback --step=1` from that (newer) release *before*
# switching back, because the older release does not contain that migration.
set -euo pipefail

SITE="$HOME/rashedulraju.dev"
cd "$SITE"

current="$(basename "$(readlink -f current)")"
target="${1:-$(ls -1 releases | sort | grep -B1 -x "$current" | head -n1)}"

if [[ -z "$target" || "$target" == "$current" || ! -d "releases/$target" ]]; then
    echo "No earlier release to roll back to (current: $current)." >&2
    exit 1
fi

echo "Rolling back: $current -> $target"
ln -sfn "$SITE/releases/$target" "$SITE/current.tmp"
mv -Tf "$SITE/current.tmp" "$SITE/current"      # atomic switch

cd "$SITE/current"
php artisan optimize
php artisan responsecache:clear
php artisan queue:restart
php artisan inertia:stop-ssr || true             # Supervisor restarts it in the new current
sudo -n service php8.4-fpm reload 2>/dev/null || echo "Reload PHP-FPM from Forge (Server -> PHP -> Restart) to clear OPcache."

sleep 3
curl -fsS --max-time 10 -o /dev/null https://rashedulraju.dev/up && echo "Live on $target."

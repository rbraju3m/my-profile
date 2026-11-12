#!/usr/bin/env bash
# Prints fresh `set_real_ip_from` lines for deploy/nginx-cloudflare.conf.
set -euo pipefail
for list in ips-v4 ips-v6; do
    curl -fsS "https://www.cloudflare.com/$list" | sed 's/^/set_real_ip_from /; s/$/;/'
done

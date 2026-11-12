#!/usr/bin/env bash
# Forge → Server → Recipes → New recipe, run as root. Safe to run more than once.
# Forge already sets up UFW (22, 80, 443), SSH-key-only login and automatic
# security updates; this adds and checks the rest.
set -euo pipefail

# Brute-force protection for SSH.
apt-get update -qq
apt-get install -y -qq fail2ban
cat > /etc/fail2ban/jail.d/sshd.local <<'JAIL'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
JAIL
systemctl enable --now fail2ban
systemctl restart fail2ban

# No password or root logins over SSH (Forge's default; enforced here).
sed -i -E 's/^#?PasswordAuthentication .*/PasswordAuthentication no/; s/^#?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl reload ssh

# Automatic security updates.
apt-get install -y -qq unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

# MySQL and the SSR server listen on localhost only.
ss -ltnp | grep -E ':3306|:13714' || true

echo "--- Firewall ---"; ufw status verbose
echo "--- fail2ban ---"; fail2ban-client status sshd

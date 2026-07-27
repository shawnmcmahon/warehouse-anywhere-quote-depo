#!/bin/bash
# Quote Depot — EC2 user-data bootstrap (Amazon Linux 2023, arm64/x86_64)
# Paste into EC2 "User data" or run once on a fresh instance as root/ec2-user with sudo.
set -euo pipefail

APP_DIR=/opt/quotedepot
DATA_DIR=/data
REPO_URL="${QUOTEDEPOT_REPO_URL:-https://github.com/shawnmcmahon/warehouse-anywhere-quote-depo.git}"
BRANCH="${QUOTEDEPOT_BRANCH:-main}"

dnf update -y
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user || true

# Compose plugin
if ! docker compose version >/dev/null 2>&1; then
  mkdir -p /usr/local/lib/docker/cli-plugins
  COMPOSE_VER=v2.29.7
  ARCH=$(uname -m)
  case "$ARCH" in
    aarch64|arm64) COMPOSE_ARCH=aarch64 ;;
    *) COMPOSE_ARCH=x86_64 ;;
  esac
  curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VER}/docker-compose-linux-${COMPOSE_ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

mkdir -p "$DATA_DIR/uploads" "$APP_DIR"
chown -R ec2-user:ec2-user "$DATA_DIR" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

ENV_FILE="$APP_DIR/deploy/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
# Fill Cognito values before first production start.
# See deploy/README.md
ASPNETCORE_ENVIRONMENT=Production
Cognito__Region=us-east-1
Cognito__UserPoolId=
Cognito__ClientId=
Cognito__UseDevAuth=false
Data__SqlitePath=/data/quotedepot.db
Data__UploadsPath=/data/uploads
EOF
  chown ec2-user:ec2-user "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE — edit Cognito settings, then: cd $APP_DIR/deploy && docker compose --env-file .env up -d --build"
  exit 0
fi

cd "$APP_DIR/deploy"
docker compose --env-file .env up -d --build
echo "Quote Depot started. HTTP on port 8080 (or 80 if you mapped TLS/Nginx on the host)."

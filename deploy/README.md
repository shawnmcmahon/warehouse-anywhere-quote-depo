# Deploy Quote Depot on one EC2 (&lt; ~$20/mo)

Single-instance Docker Compose: **Nginx (SPA + `/api` proxy) + ASP.NET API + SQLite/uploads on a volume**. No ALB.

See [COST.md](./COST.md) for the monthly breakdown.

## 1. Create Cognito (manual, once)

In the AWS Console (same region as the EC2):

1. **Cognito → User pools → Create**
   - Sign-in: email
   - Required attributes: email (name optional)
   - App client: public client (no secret) for the SPA; note **Client ID**
2. Note **Region**, **User Pool ID**, **App client ID**

### Email verification (sign-up)

By default Cognito sends a **verification code** (not a link). The Quote Depot sign-in page includes a **Verify email** step at `/signin?mode=verify` where users enter that code after sign-up.

Optional: in the user pool **Message templates → Verification message**, you can switch type to **Link** and include `{##Verify your email##}` in the template. That link opens Cognito's confirmation page (not your app). For a one-click link that lands back on Quote Depot, you need a Custom Message Lambda plus a small backend endpoint — code entry in the app is the simpler path for embedded auth.

Put values into `deploy/.env` (never commit that file):

```bash
cp ../.env.example .env
# edit Cognito__* and set Cognito__UseDevAuth=false
```

## 2. Launch EC2

| Setting | Value |
| ------- | ----- |
| AMI | Amazon Linux 2023 |
| Instance | `t4g.micro` (Graviton) preferred, or `t3.micro` |
| Storage | 20 GB gp3 |
| Security group | Inbound **22** (your IP), **80**, **443** |
| Elastic IP | Allocate and associate (keeps DNS stable) |
| User data | Optional: paste [ec2-userdata.sh](./ec2-userdata.sh) |

SSH in and finish Cognito env if user-data left a stub `.env`:

```bash
sudo nano /opt/quotedepot/deploy/.env
cd /opt/quotedepot/deploy
docker compose --env-file .env up -d --build
```

App listens on **host port 8080** by default (`web` service). Point DNS at the Elastic IP when ready.

Without user-data, on a fresh box:

```bash
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# re-login for docker group
git clone https://github.com/shawnmcmahon/warehouse-anywhere-quote-depo.git
cd warehouse-anywhere-quote-depo/deploy
cp ../.env.example .env   # fill Cognito
docker compose --env-file .env up -d --build
```

## 3. TLS (no ALB)

Pick one:

### A. Cloudflare (simplest)

1. Point the domain to the Elastic IP (proxied orange cloud)
2. SSL/TLS mode **Full** (HTTP origin on 8080 or map host 80→web)
3. Optional: Cloudflare Authenticated Origin pulls; not required for MVP

### B. Let’s Encrypt on the host (certbot + host Nginx)

1. Map compose `web` to `127.0.0.1:8080` only (or keep internal)
2. Install Nginx + certbot on the host
3. Proxy `https://your.domain` → `http://127.0.0.1:8080`
4. See [nginx-tls.host.example.conf](./nginx-tls.host.example.conf)

Renewal: `certbot renew` (systemd timer on Amazon Linux packages).

**Do not** put Cognito secrets in the image; only in `deploy/.env` or SSM Parameter Store later.

## 4. Data durability

Compose mounts named volume `quotedepot-data` → `/data` in the API container:

- `quotedepot.db` — SQLite
- `uploads/` — org logos

Backups (manual MVP): stop API briefly or use `sqlite3 .backup`, copy `/var/lib/docker/volumes/...` or bind-mount `/data` to the host EBS path.

Optional bind mount instead of named volume (edit compose):

```yaml
volumes:
  - /data:/data
```

## 5. Verify

```bash
curl -sS http://127.0.0.1:8080/api/health
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f api
```

Production auth requires real Cognito JWTs (`Cognito__UseDevAuth=false`). DevAuth must never be enabled on a public instance.

## 6. Updates

```bash
cd /opt/quotedepot
git pull
cd deploy
docker compose --env-file .env up -d --build
```

# Quote Depot — Tools

## Stack

| Layer | Choice |
| ----- | ------ |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | ASP.NET Core 8 Web API |
| Data | EF Core + SQLite (file on EBS) |
| Auth | Amazon Cognito (email + Google) |
| Deploy | Single EC2, Docker Compose, Nginx (no ALB) |
| Backend tests | xUnit |
| E2E | Python Playwright (after UI exists) |

## Local development

```bash
# API (from repo root)
dotnet run --project backend/QuoteDepot.Api

# Frontend (separate terminal)
cd frontend && npm run dev
```

- API: `http://localhost:5101` (Swagger in Development)
- SPA: `http://localhost:5173` (proxies `/api` → API)
- Health: `GET /api/health`
- Bootstrap (auth): `POST /api/me/bootstrap` with `Authorization: Bearer <JWT>`

### Auth

- Production: set `Cognito__Region`, `Cognito__UserPoolId`, `Cognito__ClientId` (see `.env.example`).
- Local Development: `Cognito:UseDevAuth=true` validates HS256 JWTs issued for issuer `quote-depot-dev` (tests use the same).

## Docker (local)

```bash
cp .env.example deploy/.env
# For local Compose you may set Cognito__UseDevAuth=true in deploy/.env
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up --build
```

Serves SPA + API proxy on `http://localhost:8080`.

## Production (EC2)

See [deploy/README.md](../deploy/README.md) and [deploy/COST.md](../deploy/COST.md):

1. Create Cognito User Pool (manual) and fill `deploy/.env`
2. Launch `t4g.micro` + 20 GB gp3 + Elastic IP
3. Run [deploy/ec2-userdata.sh](../deploy/ec2-userdata.sh) or Compose by hand
4. Add TLS via Cloudflare or host Let’s Encrypt ([nginx-tls.host.example.conf](../deploy/nginx-tls.host.example.conf))

## Execution order

1. Backend features first (domain → auth → orgs → requests/quotes → dashboard/audit).
2. Deploy docs/scripts.
3. **Checkpoint**: switch models before frontend design.
4. Design explorations + app screens last.
5. Playwright E2E after UI.

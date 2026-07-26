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

## Docker (local)

```bash
docker compose -f deploy/docker-compose.yml up --build
```

Serves SPA + API proxy on `http://localhost:8080`.

## Execution order

1. Backend features first (domain → auth → orgs → requests/quotes → dashboard/audit).
2. Deploy docs/scripts.
3. **Checkpoint**: switch models before frontend design.
4. Design explorations + app screens last.
5. Playwright E2E after UI.

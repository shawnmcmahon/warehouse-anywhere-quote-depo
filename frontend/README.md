# Quote Depot

Organizations, RFQ requests, and quotes — ASP.NET Core 8 + React/Vite/Tailwind, Cognito auth, SQLite on a single small EC2.

## Status

Backend-first build. Frontend is a minimal shell until the API is complete; design explorations (/1, /2, /3) are intentionally deferred.

## Repo layout

```
backend/          ASP.NET Core API, Domain, Infrastructure
frontend/         Vite + React + TypeScript + Tailwind (minimal shell)
tests/backend/    xUnit
tests/e2e/        Playwright (later)
deploy/           Docker Compose + Nginx
docs/             GOAL.md, TOOLS.md
```

## Prerequisites

- .NET 8 SDK
- Node.js 20+
- Docker (optional, for compose)

## Quick start

```bash
# Terminal 1 — API
dotnet run --project backend/QuoteDepot.Api

# Terminal 2 — SPA
cd frontend
npm install
npm run dev
```

- API + Swagger: http://localhost:5101/swagger
- Health: http://localhost:5101/api/health
- SPA: http://localhost:5173

## Docker

```bash
docker compose -f deploy/docker-compose.yml up --build
```

Open http://localhost:8080

## Tests

```bash
dotnet test
```

## Contributing

Each major feature ships as its own branch → PR → squash merge into `main`. See the build plan for the PR sequence.
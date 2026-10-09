# RESS PLTS Monitoring Dashboard

Full-stack monorepo for monitoring solar plants, devices, sensor readings, alarms, and maintenance workflows.

## Stack

- Frontend: SvelteKit, Svelte 5, TailwindCSS, Apache ECharts
- Backend: Bun, TypeScript, Elysia, Drizzle ORM
- Database: PostgreSQL with a TimescaleDB-ready schema
- Messaging: Eclipse Mosquitto MQTT
- Proxy: Nginx

## Repository structure

```text
ress-dashboard/
  apps/
    frontend/              SvelteKit dashboard
    backend/               Elysia API and Drizzle database layer
  packages/
    shared-types/          Shared TypeScript API contracts
  nginx/
    nginx.conf             Reverse proxy configuration
  docker-compose.yml       PostgreSQL, MQTT, and Nginx
  .env.example             Local environment template
```

## Prerequisites on Windows

Install:

- Bun
- Docker Desktop with WSL2 integration enabled
- Git

PowerShell command examples below are Bun-first to avoid npm/node runtime usage in daily development.

## Local development

1. Open PowerShell in the repository root:

```powershell
cd C:\Users\ramad\Downloads\ress-dashboard
```

2. Create local environment files:

```powershell
Copy-Item .env.example .env
Copy-Item apps\backend\.env.example apps\backend\.env
Copy-Item apps\frontend\.env.example apps\frontend\.env
```

3. Start PostgreSQL/TimescaleDB, MQTT, and Nginx:

```powershell
docker compose up -d postgres mqtt nginx
```

4. Install backend dependencies and prepare the database:

```powershell
cd apps\backend
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

5. In a second PowerShell window, install and start the frontend:

```powershell
cd C:\Users\ramad\Downloads\ress-dashboard\apps\frontend
bun install
bun run dev
```

6. Open the application:

- Frontend: http://localhost:5173
- Backend health: http://localhost:3000/health
- Swagger: http://localhost:3000/swagger
- Nginx gateway: http://localhost

## Root scripts

From the repository root:

```powershell
bun run infra:up
bun run dev:backend
bun run dev:frontend
bun run db:generate
bun run db:migrate
bun run build:frontend
bun run infra:down
```

## Backend API

- `GET /health`
- `GET /api/devices`
- `GET /api/readings?limit=100`
- `GET /api/readings/latest`
- `POST /api/ingest`

Example ingestion body:

```json
{
  "deviceId": "00000000-0000-0000-0000-000000000000",
  "metric": "active_power_kw",
  "value": 94.82,
  "timestamp": "2026-09-18T12:00:00.000Z"
}
```

## Frontend API client

The typed client is available at `apps/frontend/src/lib/api/client.ts` and uses `VITE_API_BASE_URL`. Shared response contracts live in `packages/shared-types/src/index.ts`.

## Database and migrations

Drizzle schema is in `apps/backend/src/db/schema.ts`. Migration configuration is in `apps/backend/drizzle.config.ts`, and generated SQL migrations are stored in `apps/backend/drizzle/`.

The default Docker database uses `timescale/timescaledb:latest-pg16`, while the schema remains compatible with standard PostgreSQL.

## Production-like Docker run

Build and run the infrastructure services:

```powershell
docker compose up -d --build
```

For a complete production deployment, build the frontend and backend artifacts in CI, run the backend as a managed Bun service, and point Nginx at the frontend and backend service names rather than `host.docker.internal`.

Stop services:

```powershell
docker compose down
```

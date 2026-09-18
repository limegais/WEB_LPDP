# RESS Dashboard Monorepo

Monorepo untuk dashboard monitoring RESS/PLTS.

## Stack

- Frontend: SvelteKit + TailwindCSS + Apache ECharts
- Backend: Bun + TypeScript + Elysia + Drizzle ORM
- Database: PostgreSQL (opsional TimescaleDB)
- Infra: Nginx + MQTT Broker (Mosquitto)

## Struktur

```
ress-dashboard/
  apps/
    frontend/
    backend/
  nginx/
  docker-compose.yml
```

## Prasyarat

- Bun
- Node.js 20+
- Docker + Docker Compose

## Jalankan Lokal

1. Salin environment:

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

2. Jalankan service infra:

```bash
docker compose up -d postgres mqtt nginx
```

3. Install dependency backend:

```bash
cd apps/backend
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

4. Install dependency frontend:

```bash
cd apps/frontend
npm install
npm run dev
```

5. Akses:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/swagger

## Script Penting

Backend:

- `bun run dev`
- `bun run db:generate`
- `bun run db:migrate`
- `bun run db:studio`

Frontend:

- `npm run dev`
- `npm run build`
- `npm run preview`

## Catatan

- Jika ingin TimescaleDB, image default sudah Timescale. Tetap kompatibel dengan PostgreSQL biasa.
- Nginx config tersedia di folder `nginx` untuk reverse proxy produksi/dev gateway.

# SINTA Website

Sitio web de SINTA eSports construido con Next.js (App Router), React y TypeScript.

## Requisitos

- Node.js `>=20.9.0` (recomendado LTS actual)
- npm

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:db
npm run import:results -- --dry-run
npm run import:results -- --apply
```

## Desarrollo

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Levantar entorno local:
   ```bash
   npm run dev
   ```
3. Abrir `http://localhost:3000`.

## Entorno (DB)

1. Crear `.env` a partir de `.env.example`.
2. Definir `DATABASE_URL` con la cadena de conexion de Supabase (Postgres).

Ejemplo:

```bash
DATABASE_URL=postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

Notas:
- Para `session pooler`, usar el usuario `postgres.<project-ref>`.
- Si la password tiene caracteres especiales (`@`, `!`, `:`, `/`, etc), debe ir URL-encoded.

## Health check de DB

- Endpoint: `GET /api/health/db`
- Respuesta esperada:
  - `200` con `{ ok: true, latencyMs, serverTimeIso }` cuando hay conectividad.
  - `503` con `{ ok: false }` cuando falla.

## Tests de DB

- `npm run test`: unit tests (incluye validaciones de entorno).
- `npm run test:db`: integration test de conectividad real usando `.env`.

## Estructura principal

- `app/layout.tsx`: layout global + metadata.
- `app/page.tsx`: home principal.
- `app/components/navbar.tsx`: navegacion superior.
- `lib/server/db.ts`: pool y health query para Postgres/Supabase.
- `lib/server/env.ts`: validacion tipada de `DATABASE_URL`.
- `pages/api/hello.ts`: endpoint API de ejemplo.
- `db/migrations/001_results_schema.sql`: schema para historial de resultados.
- `db/migrations/002_results_views.sql`: views para agregados y highlights.
- `scripts/import-results-xlsx.ts`: import manual/idempotente desde `.xlsx`.
- `app/api/v1/*`: endpoints de resultados, roster y pilotos.

## Results API (v1)

- `GET /api/v1/results/events`
- `GET /api/v1/results/highlights`
- `GET /api/v1/results/stats`
- `GET /api/v1/results/filters`
- `GET /api/v1/team`
- `GET /api/v1/drivers`
- `GET /api/v1/drivers/:slug`
- `GET /api/v1/drivers/:slug/results`

## Import workflow

1. Apply SQL files from `db/migrations/` in order.
2. Run dry-run import:
   ```bash
   npm run import:results -- --dry-run
   ```
3. Apply import:
   ```bash
   npm run import:results -- --apply
   ```
4. Verify API:
   - `GET /api/v1/results/filters`
   - `GET /api/v1/results/highlights`

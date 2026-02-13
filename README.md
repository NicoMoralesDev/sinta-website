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

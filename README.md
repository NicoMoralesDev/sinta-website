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

## Estructura principal

- `app/layout.tsx`: layout global + metadata.
- `app/page.tsx`: home principal.
- `app/components/navBar/NavBar.tsx`: navegacion superior.
- `pages/api/hello.ts`: endpoint API de ejemplo.

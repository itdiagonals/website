# Diagonals Website

This repository contains two main application surfaces:

- a Next.js + Payload CMS application in the repository root
- a Go backend API in `backend/`

The local stack uses separate Postgres databases for Payload and the Go backend so schema ownership stays explicit and safer to operate.

## Architecture summary

- Payload CMS owns the CMS database and admin panel.
- Go backend owns its own database and serves customer auth, cart, and product API endpoints.
- Catalog data is mirrored from Payload into backend-owned read model tables through a signed internal sync flow.
- Backend public product endpoints read only from backend-owned catalog tables.

## Prerequisites

Make sure the following are installed locally:

- Node.js 20+
- pnpm
- Docker Desktop

Go 1.25+ is only needed if you want to run the backend outside Docker.

## Environment files

There are two env files used in local development.

Root `.env` is used by Next.js / Payload.

- `PAYLOAD_DATABASE_URL`: Payload database connection
- `PAYLOAD_ENABLE_PUSH`: local-only schema push flag for Payload dedicated database
- `BACKEND_CATALOG_SYNC_URL`: internal backend endpoint used by Payload sync
- `CATALOG_SYNC_SECRET`: shared secret for signed catalog sync requests
- `REDIS_URL`: Redis connection for local stack
- `S3_*`: MinIO / object storage settings

`backend/.env` is used by the Go backend.

- `BACKEND_DATABASE_URL`: backend database connection
- `REFRESH_TOKEN_SECRET`: refresh token signing secret
- `ACCESS_TOKEN_SECRET`: access token signing secret
- `CATALOG_SYNC_SECRET`: same shared secret as root `.env`
- `BACKEND_GIN_MODE`: backend runtime mode
- `BACKEND_TRUSTED_PROXIES`: trusted proxy allowlist for Gin

Important:

- Keep `CATALOG_SYNC_SECRET` identical in both env files.
- For local development, `PAYLOAD_ENABLE_PUSH=true` is acceptable because Payload uses its own dedicated database.
- For production, set `PAYLOAD_ENABLE_PUSH=false`.

## Local setup from zero

Follow these steps in order.

1. Install JavaScript dependencies.

```bash
pnpm install
```

2. Clean old Docker state if you are coming from the previous shared-database setup.

```bash
docker compose down -v
```

3. Start the local infrastructure.

```bash
docker compose up -d --build
```

This starts:

- Payload Postgres on `localhost:5432`
- Backend Postgres on `localhost:5433`
- Backend API on `localhost:8080`
- Redis on `localhost:6379`
- MinIO on `localhost:9000`

4. In a separate terminal, start Next.js / Payload.

```bash
pnpm dev
```

The app runs on `http://localhost:3000`.

Backend migrations now run automatically when the backend container starts.

5. Seed the Payload catalog database.

```bash
pnpm seed
```

6. Run the initial catalog sync so backend read model tables are populated.

```bash
pnpm sync:catalog
```

7. Verify the backend product API.

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/products
```

If setup is healthy, you should receive product data from the backend-owned catalog read model.

## Daily development flow

After the first bootstrap, normal local development is:

1. `docker compose up -d`
2. start Next.js / Payload: `pnpm dev`

Catalog behavior:

- `pnpm seed` is only needed when you want to recreate starter catalog data.
- `pnpm sync:catalog` is mainly for first sync or reconciliation.
- after initial sync, create/update/delete in Payload should sync automatically to backend.

## Useful commands

Start infrastructure:

```bash
docker compose up -d --remove-orphans
```

Stop infrastructure:

```bash
docker compose down
```

Hard reset local data:

```bash
docker compose down -v
```

Show backend container logs:

```bash
docker compose logs -f backend
```

Restart backend container:

```bash
docker compose restart backend
```

Start Next.js / Payload:

```bash
pnpm dev
```

Seed catalog:

```bash
pnpm seed
```

Backfill / reconcile backend catalog read model:

```bash
pnpm sync:catalog
```

Lint frontend / Next code:

```bash
pnpm lint
```

Compile-test backend packages:

```bash
cd backend
go test ./...
```

## Catalog sync details

Catalog data is mirrored into backend-owned read model tables through a signed internal sync endpoint.

- initial population is done with `pnpm sync:catalog`
- later updates are pushed automatically by Payload collection hooks
- sync events are idempotent through `eventId` tracking in the backend

If catalog data ever drifts, re-run:

```bash
pnpm sync:catalog
```

## Customer auth model

The Go backend uses customer sessions with:

- short-lived access token
- longer-lived refresh token
- server-side session records in backend-owned tables

This means customer auth is handled by the Go backend, not by Payload auth.

## Production notes

Before production deployment, make sure all of the following are done:

1. Set `PAYLOAD_ENABLE_PUSH=false`.
2. Replace all local secrets with strong production secrets.
3. Keep Payload and backend databases separated.
4. Expose the catalog sync endpoint only on trusted internal networks.
5. Inject production backend connection strings through the deploy platform instead of relying on local-only `localhost` values.
6. Set `BACKEND_GIN_MODE=release`.
7. Set `BACKEND_TRUSTED_PROXIES` to the actual proxy or ingress IP ranges.
7. Add regular backup and restore procedures for both databases.

## Troubleshooting

If `pnpm dev` fails with a lock error:

```powershell
if (Test-Path .next\dev\lock) { Remove-Item .next\dev\lock -Force }
```

If ports are already occupied, stop the stale process or container first.

If backend products return `null` or an empty list:

1. make sure backend migrations were run
2. make sure `pnpm seed` finished successfully
3. re-run `pnpm sync:catalog`

If catalog sync fails, verify:

1. Next.js is running on port `3000`
2. backend API is running on port `8080`
3. `CATALOG_SYNC_SECRET` matches in root `.env` and `backend/.env`

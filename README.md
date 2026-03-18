# Diagonals Website

This repository contains two main application surfaces:

- a Next.js + Payload CMS application in the repository root
- a Go backend API in `backend/`

The local stack uses separate Postgres databases for Payload and the Go backend so schema ownership stays explicit and safer to operate.

## Architecture summary

- Payload CMS owns the CMS database and admin panel.
- Go backend owns its own database and serves customer auth, cart, and product API endpoints.
- Backend public product endpoints read catalog data directly from Payload-owned tables.

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
- `REDIS_URL`: Redis connection for local stack
- `S3_*`: MinIO / object storage settings

`backend/.env` is used by the Go backend.

- `REFRESH_TOKEN_SECRET`: refresh token signing secret
- `ACCESS_TOKEN_SECRET`: access token signing secret
- `BACKEND_GIN_MODE`: backend runtime mode
- `BACKEND_TRUSTED_PROXIES`: trusted proxy allowlist for Gin

Important:

- For local development, `PAYLOAD_ENABLE_PUSH=true` is acceptable because Payload uses its own dedicated database.
- For production, set `PAYLOAD_ENABLE_PUSH=false`.
- The Go backend reads `BACKEND_DATABASE_URL` and `PAYLOAD_DATABASE_URL` from `backend/.env`.

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
docker compose up -d payload-postgres backend-postgres redis minio minio-init
```

This starts:

- Payload Postgres on `localhost:5432`
- Backend Postgres on `localhost:5433`
- Redis on `localhost:6379`
- MinIO on `localhost:9000`

4. In a separate terminal, start Next.js / Payload.

```bash
pnpm dev
```

The app runs on `http://localhost:3000`.

5. In another terminal, run backend migrations.

```bash
cd backend
go run ./cmd/migration
```

6. Start the backend locally.

```bash
cd backend
go run .
```

7. Seed the Payload catalog database.

```bash
pnpm seed
```

8. Verify the backend product API.

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/products
```

If setup is healthy, you should receive product data read directly from the Payload database.

## Daily development flow

After the first bootstrap, normal local development is:

1. `docker compose up -d`
2. start Next.js / Payload: `pnpm dev`
3. start backend locally from `backend/`: `go run .`

Catalog behavior:

- `pnpm seed` is only needed when you want to recreate starter catalog data.
- create/update/delete in Payload is reflected immediately because the backend reads the Payload database directly.

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

Start Next.js / Payload:

```bash
pnpm dev
```

Start backend locally:

```bash
cd backend
go run .
```

Run backend migrations:

```bash
cd backend
go run ./cmd/migration
```

Seed catalog:

```bash
pnpm seed
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
4. Inject deployment-safe values for `BACKEND_DATABASE_URL` and `PAYLOAD_DATABASE_URL`.
5. Set `BACKEND_GIN_MODE=release`.
6. Set `BACKEND_TRUSTED_PROXIES` to the actual proxy or ingress IP ranges.
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
3. make sure Payload schema has been pushed to `payload`
4. make sure `backend/.env` points `PAYLOAD_DATABASE_URL` to `localhost:5432` and `BACKEND_DATABASE_URL` to `localhost:5433`

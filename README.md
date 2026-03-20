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
- make (GNU Make)

Go 1.25+ is only needed if you want to run the backend outside Docker.

## Environment files

There are three env files in this repository, but Docker-first local development mainly uses two of them.

Root `.env` is used by Next.js / Payload.

- `PAYLOAD_DATABASE_URL`: Payload database connection
- `PAYLOAD_ENABLE_PUSH`: local-only schema push flag for Payload dedicated database
- `REDIS_URL`: Redis connection for local stack
- `S3_*`: MinIO / object storage settings

`backend/.env` is only used when running backend directly on host (`go run .`).

`backend/.env.docker` is used when running backend in Docker (`make up`, `make updb`, `make upb`).

Before running Docker stack, create `backend/.env.docker` from the template:

```bash
cp backend/.env.example backend/.env.docker
```

PowerShell alternative:

```powershell
Copy-Item backend/.env.example backend/.env.docker
```

Then adjust values as needed.

`backend/.env.docker` should include at least:

- `REFRESH_TOKEN_SECRET`: refresh token signing secret
- `ACCESS_TOKEN_SECRET`: access token signing secret
- `BACKEND_GIN_MODE`: backend runtime mode
- `BACKEND_TRUSTED_PROXIES`: trusted proxy allowlist for Gin
- `BITESHIP_BASE_URL`: Biteship API base URL (default `https://api.biteship.com`)
- `BITESHIP_API_KEY`: Biteship API key (`biteship_test...` or `biteship_live...`)
- `BITESHIP_ORIGIN_AREA_ID`: fixed origin area id from Biteship Maps API

Important:

- For local development, `PAYLOAD_ENABLE_PUSH=true` is acceptable because Payload uses its own dedicated database.
- For production, set `PAYLOAD_ENABLE_PUSH=false`.
- In Docker mode, the Go backend reads `BACKEND_DATABASE_URL` and `PAYLOAD_DATABASE_URL` from `backend/.env.docker`.
- Biteship Maps, Rates, and Tracking APIs are paid in both sandbox and production. Use caching and debounce in clients to reduce request volume.

## Local setup from zero

Follow these steps in order (Docker Compose only).

1. Create Docker backend env file.

```bash
cp backend/.env.example backend/.env.docker
```

2. Clean old Docker state if you are coming from the previous shared-database setup.

```bash
make downv
```

3. Start all services with Docker Compose.

```bash
make updb
```

This command builds and runs the stack in detached mode:

- Payload Postgres on `localhost:5432`
- Backend Postgres on `localhost:5433`
- Backend API on `localhost:8080`
- Redis on `localhost:6379`
- MinIO on `localhost:9000`

Backend migrations run automatically when the backend container starts.

4. Verify backend API is reachable.

```powershell
Invoke-RestMethod http://localhost:8080/ping
```

5. Stop all services.

```bash
make down
```

Optional (full reset including volumes/data):

```bash
make downv
```

## Daily development flow

After initial setup, normal daily flow is:

1. `make updb`
2. `make down`

Catalog behavior:

- create/update/delete in Payload is reflected immediately because the backend reads the Payload database directly.
- shipping accuracy depends on product dimensions and weight in Payload (`length`, `width`, `height`, `weight`).

## Useful commands

See all available targets:

```bash
make help
```

Start all services with build (detached):

```bash
make updb
```

Start all services (foreground):

```bash
make up
```

Follow logs:

```bash
make logs
```

Stop all services:

```bash
make down
```

Hard reset local data:

```bash
make downv
```

Open backend container shell:

```bash
make shell
```

Open backend database psql:

```bash
make db
```

Build containers:

```bash
make build
```

Compile-test backend packages:

```bash
make backend-test
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

If ports are already occupied, stop the stale process or container first.

If backend products return `null` or an empty list:

1. make sure containers are healthy (`make ps` and `make logs`)
2. make sure Payload schema has been pushed to `payload`
3. make sure `backend/.env.docker` points `PAYLOAD_DATABASE_URL` to `payload-postgres:5432` and `BACKEND_DATABASE_URL` to `backend-postgres:5432`

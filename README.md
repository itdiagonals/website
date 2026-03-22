# Diagonals Website

This repository contains two application surfaces:

- Next.js + Payload app in repository root
- Go backend API in `backend/`

The local setup keeps Payload and backend schemas in different databases.

## Architecture summary

- Payload owns CMS and admin flows.
- Go backend owns customer auth, cart, checkout, and transaction APIs.
- Product catalog data is read from Payload-owned tables.

## Docker compose model

This project now uses two compose files:

- `docker-compose.yml`: infra-first stack (Payload Postgres, Backend Postgres, Redis, MinIO, MinIO init)
- `docker-compose.backend.yml`: backend integration overlay (migration + backend API)

This means daily development can run without backend container, and backend can be started only when frontend needs integration testing.

## Prerequisites

- Node.js 20+
- pnpm
- Docker Desktop
- GNU Make

Go 1.25+ is only required if running backend outside Docker.

## Environment files

Main env files:

- `.env` (root): Next.js / Payload
- `backend/.env`: backend host-run (`go run .`)
- `backend/.env.docker`: backend docker-run

Create docker env file first:

```bash
cp backend/.env.example backend/.env.docker
```

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env.docker
```

Important keys in `backend/.env.docker`:

- `BACKEND_DATABASE_URL`
- `PAYLOAD_DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `BACKEND_GIN_MODE`
- `BACKEND_TRUSTED_PROXIES`

## First-time local setup

1. Prepare env file.

```bash
cp backend/.env.example backend/.env.docker
```

2. Optional clean reset (if switching from older setup).

```bash
make downv
```

3. Start infra only (detached).

```bash
make updb
```

4. If frontend needs backend API integration, start backend.

```bash
make backend-up
```

5. Verify backend ping (only after `make backend-up`).

```powershell
Invoke-RestMethod http://localhost:8080/ping
```

6. Stop all containers.

```bash
make down
```

## Daily workflows

### 1) Infra-only workflow (default)

Use this for normal frontend/payload work without backend API container.

```bash
make updb
```

Stop when done:

```bash
make down
```

### 2) Backend integration workflow (on demand)

Start backend on top of existing infra:

```bash
make backend-up
```

Notes:

- migration runs first through `backend-migrate`
- backend container starts after migration succeeds

Stop backend only (keep infra running):

```bash
make backend-down
```

### 3) Full stack workflow (one command)

Run infra + backend integration stack directly:

```bash
make full-updb
```

## Migration options

Run migration via Docker one-shot service:

```bash
make migrate-up
```

Run migration locally from host:

```bash
make migrate-up-local
```

## Make targets quick reference

Show all targets:

```bash
make help
```

Common targets:

- `make up`, `make upb`, `make updb`: infra stack only
- `make full-up`, `make full-upb`, `make full-updb`: infra + backend stack
- `make backend-up`, `make backend-down`: toggle backend integration mode
- `make down`, `make downv`: stop/remove containers (and volumes for `downv`)
- `make logs`: combined logs with full compose set
- `make shell`: open backend shell (backend must be running)
- `make db`: open psql to backend postgres
- `make backend-run`: run backend on host (`go run .`)
- `make backend-test`: run backend tests

## Ports

- Payload Postgres: `localhost:5432`
- Backend Postgres: `localhost:5433`
- Redis: `localhost:6379`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`
- Backend API: `localhost:8080` (only when backend is started)

## Customer auth model

Go backend uses:

- short-lived access token
- longer-lived refresh token
- server-side session records

So customer auth is managed by Go backend, not Payload auth.

## Production notes

Before production:

1. Set `PAYLOAD_ENABLE_PUSH=false`.
2. Replace all local secrets.
3. Keep Payload and backend databases separated.
4. Inject deployment-safe DB URLs.
5. Set `BACKEND_GIN_MODE=release`.
6. Set trusted proxy ranges correctly.
7. Enable backup/restore for both databases.

## Troubleshooting

If backend endpoint fails:

1. Ensure backend is started: `make backend-up` or `make full-updb`
2. Check status/logs: `make ps` and `make logs`
3. Confirm DB URLs in `backend/.env.docker`:
	- `BACKEND_DATABASE_URL=...@backend-postgres:5432/...`
	- `PAYLOAD_DATABASE_URL=...@payload-postgres:5432/...`

If `make shell` fails, backend container is not running yet.

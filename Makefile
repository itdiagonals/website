# Project constants
PROJECT_NAME=website
COMPOSE_FILE=docker-compose.yml

DOCKER_COMPOSE=docker compose -f $(COMPOSE_FILE)

BACKEND_SERVICE=backend
BACKEND_DIR=backend

DB_CONTAINER=website-backend-postgres
DB_USERNAME=backend
DB_DATABASE=backend

.PHONY: help up upb updb infra-up down downv restart restartv build logs start stop ps shell db migrate-up migrate-up-local backend-run backend-test

help:
	@echo "Available targets:"
	@echo "  up               Start all services (foreground)"
	@echo "  upb              Start all services with build (foreground)"
	@echo "  updb             Start all services with build (detached)"
	@echo "  infra-up         Start infra services only (db, redis, minio)"
	@echo "  down             Stop and remove containers"
	@echo "  downv            Stop and remove containers + volumes"
	@echo "  restart          Recreate containers with build"
	@echo "  restartv         Recreate containers with build + reset volumes"
	@echo "  build            Build images"
	@echo "  logs             Follow logs"
	@echo "  start            Start stopped containers"
	@echo "  stop             Stop running containers"
	@echo "  ps               List containers"
	@echo "  shell            Open shell in backend container"
	@echo "  db               Open psql in backend postgres container"
	@echo "  migrate-up       Run migration binary inside backend container"
	@echo "  migrate-up-local Run migrations locally from backend/"
	@echo "  backend-run      Run backend locally (go run .)"
	@echo "  backend-test     Run backend tests"

# Start containers
up:
	$(DOCKER_COMPOSE) up

upb:
	$(DOCKER_COMPOSE) up --build

updb:
	$(DOCKER_COMPOSE) up -d --build --remove-orphans

# Start infra only
infra-up:
	$(DOCKER_COMPOSE) up -d payload-postgres backend-postgres redis minio minio-init

# Stop and remove containers
down:
	$(DOCKER_COMPOSE) down

# Stop and remove containers and volumes
downv:
	$(DOCKER_COMPOSE) down -v

# Restart containers
restart: down upb

# Restart containers with volume removal
restartv: downv upb

# Build containers
build:
	$(DOCKER_COMPOSE) build

# View logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Start containers
start:
	$(DOCKER_COMPOSE) start

# Stop containers
stop:
	$(DOCKER_COMPOSE) stop

# List all containers
ps:
	$(DOCKER_COMPOSE) ps

# Open a shell in the backend container
shell:
	$(DOCKER_COMPOSE) exec -it $(BACKEND_SERVICE) sh

# Connect to backend database
db:
	docker exec -it $(DB_CONTAINER) psql -U $(DB_USERNAME) -d $(DB_DATABASE)

# Run migration binary in backend container
migrate-up:
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) /app/migrate

# Run migrations locally
migrate-up-local:
	cd $(BACKEND_DIR) && go run ./cmd/migration

# Run backend locally
backend-run:
	cd $(BACKEND_DIR) && go run .

# Run backend tests
backend-test:
	cd $(BACKEND_DIR) && go test ./...
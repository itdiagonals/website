# Project constants
PROJECT_NAME=website
COMPOSE_FILE=docker-compose.yml
COMPOSE_BACKEND_FILE=docker-compose.backend.yml

DOCKER_COMPOSE_INFRA=docker compose -f $(COMPOSE_FILE)
DOCKER_COMPOSE_FULL=docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_BACKEND_FILE)

BACKEND_SERVICE=backend
BACKEND_MIGRATE_SERVICE=backend-migrate
BACKEND_DIR=backend

DB_CONTAINER=website-backend-postgres
DB_USERNAME=backend
DB_DATABASE=backend

.PHONY: help up upb updb infra-up full-up full-upb full-updb backend-up backend-down down downv restart restartv build logs start stop ps shell db migrate-up migrate-up-local backend-run backend-test

help:
	@echo "Available targets:"
	@echo "  up               Start infra services (foreground)"
	@echo "  upb              Start infra services with build (foreground)"
	@echo "  updb             Start infra services with build (detached)"
	@echo "  infra-up         Start infra services only (db, redis, minio)"
	@echo "  full-up          Start infra + backend integration stack (foreground)"
	@echo "  full-upb         Start infra + backend integration stack with build (foreground)"
	@echo "  full-updb        Start infra + backend integration stack with build (detached)"
	@echo "  backend-up       Start backend (with migration) on top of infra stack"
	@echo "  backend-down     Stop backend and backend-migrate containers"
	@echo "  down             Stop and remove containers"
	@echo "  downv            Stop and remove containers + volumes"
	@echo "  restart          Recreate containers with build"
	@echo "  restartv         Recreate containers with build + reset volumes"
	@echo "  build            Build infra + backend integration images"
	@echo "  logs             Follow logs"
	@echo "  start            Start stopped containers"
	@echo "  stop             Stop running containers"
	@echo "  ps               List containers"
	@echo "  shell            Open shell in backend container (integration mode)"
	@echo "  db               Open psql in backend postgres container"
	@echo "  migrate-up       Run migration service once in Docker"
	@echo "  migrate-up-local Run migrations locally from backend/"
	@echo "  backend-run      Run backend locally (go run .)"
	@echo "  backend-test     Run backend tests"

# Start containers
up:
	$(DOCKER_COMPOSE_INFRA) up

upb:
	$(DOCKER_COMPOSE_INFRA) up --build

updb:
	$(DOCKER_COMPOSE_INFRA) up -d --build --remove-orphans

# Start infra only
infra-up:
	$(DOCKER_COMPOSE_INFRA) up -d payload-postgres backend-postgres redis minio minio-init

# Start full stack (infra + backend integration)
full-up:
	$(DOCKER_COMPOSE_FULL) up

full-upb:
	$(DOCKER_COMPOSE_FULL) up --build

full-updb:
	$(DOCKER_COMPOSE_FULL) up -d --build --remove-orphans

# Start or stop backend integration services only
backend-up:
	$(DOCKER_COMPOSE_FULL) up -d --build $(BACKEND_SERVICE)

backend-down:
	$(DOCKER_COMPOSE_FULL) stop $(BACKEND_SERVICE)
	$(DOCKER_COMPOSE_FULL) rm -f $(BACKEND_SERVICE) $(BACKEND_MIGRATE_SERVICE)

# Stop and remove containers
down:
	$(DOCKER_COMPOSE_FULL) down

# Stop and remove containers and volumes
downv:
	$(DOCKER_COMPOSE_FULL) down -v

# Restart containers
restart: down upb

# Restart containers with volume removal
restartv: downv upb

# Build containers
build:
	$(DOCKER_COMPOSE_FULL) build

# View logs
logs:
	$(DOCKER_COMPOSE_FULL) logs -f

# Start containers
start:
	$(DOCKER_COMPOSE_FULL) start

# Stop containers
stop:
	$(DOCKER_COMPOSE_FULL) stop

# List all containers
ps:
	$(DOCKER_COMPOSE_FULL) ps

# Open a shell in the backend container
shell:
	$(DOCKER_COMPOSE_FULL) exec -it $(BACKEND_SERVICE) sh

# Connect to backend database
db:
	docker exec -it $(DB_CONTAINER) psql -U $(DB_USERNAME) -d $(DB_DATABASE)

# Run migration binary in backend container
migrate-up:
	$(DOCKER_COMPOSE_FULL) run --rm $(BACKEND_MIGRATE_SERVICE)

# Run migrations locally
migrate-up-local:
	cd $(BACKEND_DIR) && go run ./cmd/migration

# Run backend locally
backend-run:
	cd $(BACKEND_DIR) && go run .

# Run backend tests
backend-test:
	cd $(BACKEND_DIR) && go test ./...
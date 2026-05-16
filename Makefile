PROJECT_NAME=website
COMPOSE_FILE=docker-compose.yml
COMPOSE_BACKEND_FILE=docker-compose.backend.yml

DOCKER_COMPOSE_INFRA=docker compose -f $(COMPOSE_FILE)
DOCKER_COMPOSE_FULL=docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_BACKEND_FILE)

BACKEND_SERVICE=backend
BACKEND_MIGRATE_SERVICE=backend-migrate
BACKEND_DIR=backend

DB_CONTAINER=website-postgres
DB_USERNAME=diagonals
DB_DATABASE=diagonals

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
	@echo "  shell            Open shell in backend container"
	@echo "  db               Open psql in postgres container"
	@echo "  migrate-up       Run migration binary inside backend container"
	@echo "  migrate-up-local Run migrations locally from backend/"
	@echo "  backend-run      Run backend locally (go run .)"
	@echo "  backend-test     Run backend tests"

up:
	$(DOCKER_COMPOSE_INFRA) up

upb:
	$(DOCKER_COMPOSE_INFRA) up --build

updb:
	$(DOCKER_COMPOSE_INFRA) up -d --build --remove-orphans

infra-up:
	$(DOCKER_COMPOSE) up -d postgres redis minio minio-init

down:
	$(DOCKER_COMPOSE_FULL) down

downv:
	$(DOCKER_COMPOSE_FULL) down -v

restart: down upb

restartv: downv upb

build:
	$(DOCKER_COMPOSE_FULL) build

logs:
	$(DOCKER_COMPOSE_FULL) logs -f

start:
	$(DOCKER_COMPOSE_FULL) start

stop:
	$(DOCKER_COMPOSE_FULL) stop

ps:
	$(DOCKER_COMPOSE_FULL) ps

shell:
	$(DOCKER_COMPOSE_FULL) exec -it $(BACKEND_SERVICE) sh

db:
	docker exec -it $(DB_CONTAINER) psql -U $(DB_USERNAME) -d $(DB_DATABASE)

migrate-up:
	$(DOCKER_COMPOSE_FULL) run --rm $(BACKEND_MIGRATE_SERVICE)

migrate-up-local:
	cd $(BACKEND_DIR) && go run ./cmd/migration

backend-run:
	cd $(BACKEND_DIR) && go run .

backend-test:
	cd $(BACKEND_DIR) && go test ./...

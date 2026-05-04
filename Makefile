PROJECT_NAME=website
COMPOSE_FILE=docker-compose.yml

DOCKER_COMPOSE=docker compose -f $(COMPOSE_FILE)

BACKEND_SERVICE=backend
BACKEND_DIR=backend

DB_CONTAINER=website-postgres
DB_USERNAME=diagonals
DB_DATABASE=diagonals

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
	@echo "  db               Open psql in postgres container"
	@echo "  migrate-up       Run migration binary inside backend container"
	@echo "  migrate-up-local Run migrations locally from backend/"
	@echo "  backend-run      Run backend locally (go run .)"
	@echo "  backend-test     Run backend tests"

up:
	$(DOCKER_COMPOSE) up

upb:
	$(DOCKER_COMPOSE) up --build

updb:
	$(DOCKER_COMPOSE) up -d --build --remove-orphans

infra-up:
	$(DOCKER_COMPOSE) up -d postgres redis minio minio-init

down:
	$(DOCKER_COMPOSE) down

downv:
	$(DOCKER_COMPOSE) down -v

restart: down upb

restartv: downv upb

build:
	$(DOCKER_COMPOSE) build

logs:
	$(DOCKER_COMPOSE) logs -f

start:
	$(DOCKER_COMPOSE) start

stop:
	$(DOCKER_COMPOSE) stop

ps:
	$(DOCKER_COMPOSE) ps

shell:
	$(DOCKER_COMPOSE) exec -it $(BACKEND_SERVICE) sh

db:
	docker exec -it $(DB_CONTAINER) psql -U $(DB_USERNAME) -d $(DB_DATABASE)

migrate-up:
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) /app/migrate

migrate-up-local:
	cd $(BACKEND_DIR) && go run ./cmd/migration

backend-run:
	cd $(BACKEND_DIR) && go run .

backend-test:
	cd $(BACKEND_DIR) && go test ./...

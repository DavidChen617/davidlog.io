# Docker Compose Field Notes

## Basic structure

```yaml
# compose.yml (no version field needed in modern Compose)
services:
  api:
    build: ./src/Api
    ports:
      - "8080:8080"
    environment:
      - ConnectionStrings__Default=Host=db;Database=myapp;Username=app;Password=secret
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

## Environment variable management

Use `.env` with `env_file` — never hardcode secrets in the Compose file:

```bash
# .env (add to .gitignore)
POSTGRES_PASSWORD=my_secret_password
REDIS_PASSWORD=another_secret
```

```yaml
services:
  api:
    env_file:
      - .env
    environment:
      # These override values from env_file
      ASPNETCORE_ENVIRONMENT: Development
```

## Multiple environments

```bash
# Development
docker compose up

# Production (merge override file)
docker compose -f compose.yml -f compose.prod.yml up -d
```

```yaml
# compose.prod.yml
services:
  api:
    restart: always
    deploy:
      resources:
        limits:
          memory: 512m
```

## Useful commands

```bash
# Start in background
docker compose up -d

# Rebuild and start
docker compose up -d --build

# Tail logs
docker compose logs -f api

# Shell into a container
docker compose exec api sh

# Restart a single service
docker compose restart api

# Tear down everything including volumes
docker compose down -v
```

## Health checks and startup order

`depends_on` only waits for the container to start, not for the service to be ready. Use `condition`:

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 5
```

## Watch mode for local development

```yaml
services:
  api:
    develop:
      watch:
        - action: rebuild
          path: ./src/Api
          ignore:
            - "**/*.md"
```

```bash
docker compose watch
```

> File changes trigger an automatic rebuild — no more manual `down → up --build`.

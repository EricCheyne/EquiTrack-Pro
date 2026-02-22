# EquiTrack Pro Infrastructure

Docker and docker-compose configurations for local development and deployment.

## Local Development

Start all services with docker-compose:

```bash
docker-compose up -d
```

Stop services:

```bash
docker-compose down
```

## Services

- **postgres** - PostgreSQL database on port 5432
- **redis** - Redis cache on port 6379

## Environment Variables

Create a `.env.local` file in the root directory:

```
DATABASE_URL=postgresql://user:password@localhost:5432/equitrack
REDIS_URL=redis://localhost:6379
```

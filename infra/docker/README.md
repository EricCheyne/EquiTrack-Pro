# EquiTrack Pro Infrastructure

Docker and docker-compose configurations for local development and deployment.

## Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0

## Services

### PostgreSQL 15
- **Port:** 5432
- **Image:** `postgres:15-alpine`
- **Storage:** Persistent volume at `postgres_data`
- **Default Credentials:**
  - User: `equitrack`
  - Password: `equitrack_dev_password`
  - Database: `equitrack`

### Redis 7
- **Port:** 6379
- **Image:** `redis:7-alpine`
- **Storage:** Persistent volume at `redis_data`
- **Features:** Persistence enabled with AOF (Append Only File)

## Setup

### 1. Create Environment File

Copy the example environment file to your root directory:

```bash
cp .env.example .env.local
```

Then update `.env.local` with your desired values:

```env
# Database
DB_USER=equitrack
DB_PASSWORD=equitrack_dev_password
DB_NAME=equitrack
DB_PORT=5432

# Redis
REDIS_PORT=6379

# Application
NODE_ENV=development
```

### 2. Start Services

Start all services in the background:

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

Or with custom env file:

```bash
docker-compose -f infra/docker/docker-compose.yml --env-file .env.local up -d
```

Watch logs in real-time:

```bash
docker-compose -f infra/docker/docker-compose.yml logs -f
```

### 3. Verify Services

Check that services are healthy:

```bash
docker-compose -f infra/docker/docker-compose.yml ps
```

You should see:
- `equitrack-postgres` - UP and healthy
- `equitrack-redis` - UP and healthy

Test database connection:

```bash
psql postgresql://equitrack:equitrack_dev_password@localhost:5432/equitrack
```

Test Redis connection:

```bash
redis-cli ping
```

## Stop Services

Stop all running services:

```bash
docker-compose -f infra/docker/docker-compose.yml down
```

Stop services and remove volumes (reset database):

```bash
docker-compose -f infra/docker/docker-compose.yml down -v
```

## Useful Commands

### View logs
```bash
docker-compose -f infra/docker/docker-compose.yml logs postgres
docker-compose -f infra/docker/docker-compose.yml logs redis
```

### Connect to PostgreSQL
```bash
docker-compose -f infra/docker/docker-compose.yml exec postgres psql -U equitrack -d equitrack
```

### Connect to Redis
```bash
docker-compose -f infra/docker/docker-compose.yml exec redis redis-cli
```

### Restart services
```bash
docker-compose -f infra/docker/docker-compose.yml restart
```

### Remove all services and data
```bash
docker-compose -f infra/docker/docker-compose.yml down -v
```

## Volume Management

Both PostgreSQL and Redis use named volumes for persistence:

- `postgres_data` - Stores PostgreSQL database files
- `redis_data` - Stores Redis persistent data

View volume information:

```bash
docker volume ls | grep equitrack
docker volume inspect equitrack_postgres_data
```

## Networking

Services are connected via a Docker network `equitrack-network` for inter-service communication. This allows containers to communicate by service name (e.g., `postgres:5432` from within the API container).

## Troubleshooting

### Services won't start
Check for port conflicts:
```bash
lsof -i :5432  # For PostgreSQL
lsof -i :6379  # For Redis
```

### Database connection fails
Verify the service is running and healthy:
```bash
docker-compose -f infra/docker/docker-compose.yml ps
```

Check logs for errors:
```bash
docker-compose -f infra/docker/docker-compose.yml logs postgres
```

### Reset database
Remove volumes and restart:
```bash
docker-compose -f infra/docker/docker-compose.yml down -v
docker-compose -f infra/docker/docker-compose.yml up -d
```

## Production Considerations

For production deployments:
- Use managed database services (AWS RDS, GCP Cloud SQL, etc.) instead of containers
- Use strong, unique credentials stored in secure secret management systems
- Configure proper backup and recovery strategies
- Use persistent, redundant storage solutions
- Implement monitoring and alerting

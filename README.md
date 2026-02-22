# EquiTrack Pro

A monorepo for the EquiTrack Pro platform built with [Turbo](https://turbo.build).

## Structure

```
├── apps/
│   └── web/                 # Next.js web application
├── services/
│   └── api/                 # NestJS API server
├── packages/
│   ├── db/                  # Database layer & migrations
│   └── shared/              # Shared utilities & types
├── infra/
│   └── docker/              # Docker configuration
└── docs/
    └── adr/                 # Architecture Decision Records
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Docker & Docker Compose (for local database services)

### Installation

```bash
pnpm install
```

### Setup Local Environment

Copy the environment example file:

```bash
cp .env.example .env.local
```

### Start Database Services

Start PostgreSQL 15 and Redis 7 with Docker Compose:

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

Verify services are running:

```bash
docker-compose -f infra/docker/docker-compose.yml ps
```

See [infra/docker/README.md](./infra/docker/README.md) for detailed Docker setup and troubleshooting.

### Development

Start all development servers:

```bash
pnpm dev
```

Or run specific workspaces:

```bash
pnpm dev --filter=@equitrack/web
pnpm dev --filter=@equitrack/api
```

### Building

Build all packages:

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

### Testing

```bash
pnpm test
```

## Workspace

### Apps
- **web**: Next.js frontend application

### Services
- **api**: NestJS backend API server

### Packages
- **db**: Database schemas, migrations, and ORM configurations
- **shared**: Shared types, utilities, and constants

### Infrastructure
- **docker**: Docker and docker-compose configurations for local development

### Documentation
- **adr**: Architecture Decision Records documenting major decisions

## Commands

| Command       | Description                     |
| ------------- | ------------------------------- |
| `pnpm dev`    | Start all dev servers           |
| `pnpm build`  | Build all packages              |
| `pnpm lint`   | Run linters across all packages |
| `pnpm test`   | Run tests across all packages   |
| `pnpm format` | Format code with Prettier       |

## Contributing

Please follow the architecture decisions outlined in [docs/adr](./docs/adr).

## License

MIT

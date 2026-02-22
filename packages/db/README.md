# @equitrack/db

Database layer for EquiTrack Pro using Prisma ORM with PostgreSQL.

## Overview

This package manages database schema, migrations, and provides a type-safe database client for the entire monorepo.

## Prerequisites

- PostgreSQL 15+ running locally or via Docker
- Node.js 18+
- Environment variable `DATABASE_URL` configured

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

Ensure PostgreSQL is running (via Docker or locally):

```bash
docker-compose -f infra/docker/docker-compose.yml up -d postgres
```

### 3. Generate Prisma Client

```bash
pnpm db:generate
```

### 4. Run Migrations

Create and apply migrations:

```bash
pnpm db:migrate
```

This will:
- Detect schema differences
- Create a new migration file
- Apply migrations to the database
- Generate the Prisma Client

### 5. Seed Database (Optional)

Populate the database with initial data:

```bash
pnpm db:seed
```

## Scripts

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `pnpm db:generate`       | Generate Prisma Client                         |
| `pnpm db:migrate`        | Create and apply migrations in development     |
| `pnpm db:migrate:deploy` | Apply existing migrations (for CI/CD)          |
| `pnpm db:studio`         | Open Prisma Studio UI                          |
| `pnpm db:seed`           | Seed database with initial data                |
| `pnpm db:reset`          | Drop and recreate database (use with caution!) |
| `pnpm db:push`           | Sync schema with database without migrations   |
| `pnpm build`             | Compile TypeScript                             |

## Project Structure

```
packages/db/
├── prisma/
│   ├── schema.prisma      # Prisma schema definition
│   ├── migrations/        # Migration history
│   └── seed.ts            # Database seeding script
├── src/
│   └── index.ts           # Exported types and utilities
├── tsconfig.json          # TypeScript configuration
└── package.json
```

## Schema Models

### User
Represents application users with roles and authentication.

```prisma
model User {
  id        String
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Organization
Represents organizations within the application.

```prisma
model Organization {
  id          String
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### AuditLog
Tracks changes and actions across the application.

```prisma
model AuditLog {
  id        String
  action    String
  entity    String
  entityId  String
  changes   Json?
  userId    String?
  createdAt DateTime @default(now())
}
```

## Usage

### In Other Packages

Import the Prisma client:

```typescript
import { getPrismaClient } from "@equitrack/db";

const prisma = getPrismaClient();

const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});
```

### Environment Variables

Set the database connection string:

```env
DATABASE_URL=postgresql://equitrack:equitrack_dev_password@localhost:5432/equitrack
```

## Common Workflows

### Adding a New Model

1. Update `prisma/schema.prisma` with your new model
2. Run `pnpm db:migrate` and give the migration a descriptive name
3. The migration will be created and applied automatically
4. Run `pnpm db:generate` to update the Prisma Client types

### Viewing Data

Open Prisma Studio to browse and edit data:

```bash
pnpm db:studio
```

This opens an interactive UI at `http://localhost:5555`.

### Creating a Migration Without Schema Changes

For data transformations or complex operations:

```bash
pnpm db:migrate --name add_example_data
# Edit the generated migration file in prisma/migrations/
```

### Production Deployment

For production, use the `deploy` command:

```bash
pnpm db:migrate:deploy
```

This applies any pending migrations without prompting.

## Troubleshooting

### Connection Errors

Verify PostgreSQL is running and accessible:

```bash
psql $DATABASE_URL
```

### Prisma Client Out of Sync

Regenerate the Prisma Client:

```bash
pnpm db:generate
```

### Reset Database

⚠️ **WARNING**: This will delete all data.

```bash
pnpm db:reset
```

### Schema Drift

If you encounter schema drift warnings, either:
- Apply pending migrations: `pnpm db:migrate`
- Use `db:push` for rapid prototyping: `pnpm db:push`

## Security Notes

- ⚠️ Never commit `.env` files
- Store database credentials in environment variables
- Always hash passwords in application code before storing
- Use parameterized queries (Prisma handles this automatically)
- Restrict database user permissions in production

## Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL](https://www.postgresql.org/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

# @equitrack/api

NestJS API server for EquiTrack Pro with built-in validation, Swagger documentation, and health checks.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (running via Docker or locally)
- Redis 7+ (running via Docker or locally)

### 1. Start Dependencies

Ensure PostgreSQL and Redis are running:

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment

Copy environment template:

```bash
cp .env.local.example .env.local
```

### 4. Generate Database Client

```bash
pnpm --filter @equitrack/db db:generate
```

### 5. Run Database Migrations

```bash
pnpm --filter @equitrack/db db:migrate
```

### 6. Start Development Server

```bash
pnpm dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

## API Documentation

Swagger/OpenAPI documentation is available at:

```
http://localhost:3001/api/docs
```

## Endpoints

### Health Check

- **GET /health** - Health check with @nestjs/terminus
- **GET /health/ping** - Simple ping endpoint

Example:

```bash
curl http://localhost:3001/health/ping
# Response: { "message": "pong", "timestamp": "2026-02-22T10:30:00.000Z" }
```

## Project Structure

```
src/
├── main.ts                      # Application bootstrap
├── app.module.ts                # Root module
├── modules/
│   └── health/
│       ├── health.controller.ts # Health endpoints
│       └── health.module.ts     # Health module
├── config/
│   └── configuration.ts         # Config service (optional)
└── common/
    ├── pipes/
    │   └── validation.pipe.ts   # Custom validation pipe
    └── filters/
        └── global-exception.filter.ts # Global exception handler
```

## Features

### ✓ Global Validation Pipe

Automatic request validation with `class-validator` and `class-transformer`:
- Whitelist unknown properties
- Transform types automatically
- Detailed validation error messages

Example DTO:

```typescript
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
```

### ✓ Swagger/OpenAPI Documentation

All endpoints are automatically documented. Visit `/api/docs` to:
- View all available endpoints
- Try endpoints with the Try It Out feature
- See request/response schemas
- Review status codes and descriptions

Decorate endpoints with `@ApiOperation()` and `@ApiResponse()`:

```typescript
@Get()
@ApiOperation({ summary: "Get user by ID" })
@ApiResponse({ status: 200, description: "User found" })
userById(@Param("id") id: string) {
  // ...
}
```

### ✓ Config Module

Environment variables are automatically loaded from `.env.local` and `.env`:

```typescript
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  getPort() {
    return this.configService.get("API_PORT");
  }
}
```

### ✓ Health Checks

Endpoints for monitoring application status:

```bash
# Full health check
curl http://localhost:3001/health

# Simple ping
curl http://localhost:3001/health/ping
```

## Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `pnpm dev`   | Start development server |
| `pnpm build` | Build for production     |
| `pnpm start` | Start production server  |
| `pnpm lint`  | Run ESLint               |
| `pnpm test`  | Run tests with Jest      |

## Development

### Creating a New Module

Use the NestJS CLI:

```bash
nest generate module modules/users
nest generate controller modules/users
nest generate service modules/users
```

### Adding a New Endpoint

```typescript
import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  getUser(@Param("id") id: string) {
    return { id, name: "John Doe" };
  }
}
```

### Validation Example

```typescript
import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;
}
```

## Testing

Run the test suite:

```bash
pnpm test
pnpm test --watch
pnpm test --coverage
```

## Building for Production

```bash
pnpm build
pnpm start
```

The compiled code will be in the `dist/` directory.

## Troubleshooting

### Port Already in Use

Change the port in `.env.local`:

```env
API_PORT=3002
```

### Database Connection Error

Check the connection string:

```bash
psql $DATABASE_URL
```

### Missing Environment Variables

Ensure all required variables are defined in `.env.local` or set as system variables.

## Environment Variables

| Variable       | Description           | Default                  |
| -------------- | --------------------- | ------------------------ |
| `NODE_ENV`     | Environment mode      | `development`            |
| `API_PORT`     | Server port           | `3001`                   |
| `API_HOST`     | Server host           | `localhost`              |
| `DATABASE_URL` | PostgreSQL connection | (required)               |
| `REDIS_URL`    | Redis connection      | `redis://localhost:6379` |
| `JWT_SECRET`   | JWT signing key       | (required for auth)      |
| `LOG_LEVEL`    | Logging level         | `debug`                  |

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Swagger/OpenAPI](https://swagger.io)
- [class-validator](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)

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
├── main.ts                         # Application bootstrap
├── app.module.ts                   # Root module
├── modules/
│   └── health/
│       ├── health.controller.ts    # Health endpoints
│       └── health.module.ts        # Health module
└── common/
    ├── middleware/
    │   └── request-id.middleware.ts     # Request ID generation
    ├── services/
    │   └── structured-logger.service.ts # Structured logging
    ├── interceptors/
    │   └── http-logging.interceptor.ts  # HTTP request/response logging
    ├── filters/
    │   └── global-exception.filter.ts   # RFC 7807 Problem Details errors
    ├── types/
    │   └── problem-details.ts            # Error response types
    ├── pipes/
    │   └── validation.pipe.ts            # Custom validation pipe
    └── examples/
        └── example-logger-usage.ts       # Usage examples
```

## Features

### ✓ Request ID Middleware

Every request automatically gets a unique ID for distributed tracing:
- Generates UUID for each request
- Sets `x-request-id` header in response
- Available on Express Request object as `req.id`
- Useful for correlating logs across services

```bash
curl -i http://localhost:3001/health/ping
# Headers include: x-request-id: 550e8400-e29b-41d4-a716-446655440000
```

### ✓ Structured Logging

Comprehensive structured logging with context and metadata:
- `log()` - General logging
- `warn()` - Warning level
- `error()` - Error with stack trace
- `debug()` - Debug information
- `verbose()` - Verbose output
- `logRequest()` - HTTP request logging
- `logResponse()` - HTTP response logging with timing

Example:

```typescript
import { Injectable } from "@nestjs/common";
import { StructuredLoggerService } from "@/common/services/structured-logger.service";

@Injectable()
export class MyService {
  constructor(private logger: StructuredLoggerService) {
    this.logger.setContext("MyService");
  }

  async processData(data: any) {
    this.logger.log("Processing data", undefined, {
      recordCount: data.length,
      timestamp: Date.now(),
    });

    try {
      // Process...
      this.logger.log("Processing complete", undefined, {
        recordCount: data.length,
        duration: "150ms",
      });
    } catch (error) {
      this.logger.error("Processing failed", error, undefined, {
        recordCount: data.length,
      });
      throw error;
    }
  }
}
```

### ✓ HTTP Logging Interceptor

Automatically logs all HTTP requests and responses:
- Request: method, path, user agent, content type
- Response: status code, response time
- Includes request ID for tracing

Log output example:
```
[HTTP] ↓ GET /health/ping requestId=550e8400-e29b-41d4-a716-446655440000
[HTTP] ↑ ✓ GET /health/ping 200 requestId=550e8400-e29b-41d4-a716-446655440000 duration=5ms
```

### ✓ RFC 7807 Problem Details

All errors return standardized RFC 7807 Problem Details JSON format:

```json
{
  "type": "https://httpwg.org/specs/rfc7807.html#section-3.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/properties",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-22T10:30:00.000Z",
  "errors": {
    "email": ["Email is invalid"],
    "name": ["Name is required"]
  }
}
```

Benefits:
- Consistent error format across all endpoints
- Request ID for tracing
- Structured validation errors
- Timestamp for debugging
- Standardized by RFC 7807

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

## Using Structured Logging in Controllers

Enable HTTP logging on controllers using the `HttpLoggingInterceptor`:

```typescript
import { Controller, Post, Body, UseInterceptors } from "@nestjs/common";
import { StructuredLoggerService } from "@/common/services/structured-logger.service";
import { HttpLoggingInterceptor } from "@/common/interceptors/http-logging.interceptor";

@Controller("properties")
@UseInterceptors(HttpLoggingInterceptor)
export class PropertiesController {
  constructor(private readonly logger: StructuredLoggerService) {
    this.logger.setContext("PropertiesController");
  }

  @Post()
  async create(@Body() data: CreatePropertyDTO) {
    this.logger.log("Creating property", undefined, {
      type: data.type,
      location: data.location,
    });

    try {
      const property = await this.service.create(data);
      this.logger.log("Property created successfully", undefined, {
        propertyId: property.id,
      });
      return property;
    } catch (error) {
      this.logger.error("Failed to create property", error, undefined, {
        location: data.location,
      });
      throw error;
    }
  }
}
```

## Error Handling Examples

### Validation Errors

Validation errors automatically return RFC 7807 format:

```
POST /api/properties
{
  "name": "",
  "type": "INVALID_TYPE"
}

Response (400 Bad Request):
{
  "type": "https://httpwg.org/specs/rfc7807.html#section-3.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/properties",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-22T10:30:00.000Z",
  "errors": {
    "name": ["name should not be empty"],
    "type": ["type must be one of LAND, BUILDING, EQUIPMENT, LIVESTOCK, OTHER"]
  }
}
```

### Custom Error Responses

Throw HTTP exceptions which are automatically formatted:

```typescript
import { BadRequestException, NotFoundException } from "@nestjs/common";

@Get(":id")
async getProperty(@Param("id") id: string) {
  const property = await this.service.findById(id);
  
  if (!property) {
    throw new NotFoundException("Property not found");
  }
  
  return property;
}
```

Response (404 Not Found):
```json
{
  "type": "https://httpwg.org/specs/rfc7807.html#section-3.1",
  "title": "Not Found",
  "status": 404,
  "detail": "Property not found",
  "instance": "/api/properties/invalid-id",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-22T10:30:00.000Z"
}
```

## Request Tracing

All requests are automatically assigned a unique ID in the `x-request-id` header. Use this for end-to-end tracing:

```bash
# Request
curl -i http://localhost:3001/health/ping

# Response includes
# x-request-id: 550e8400-e29b-41d4-a716-446655440000
```

This ID is:
- Available in logs for correlation
- Passed to external services for distributed tracing
- Returned in error responses for debugging
- Useful for log aggregation tools (ELK, Splunk, etc.)

## Testing

The API includes comprehensive unit tests for all observability components:

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test -- structured-logger.spec.ts

# Run with coverage
pnpm test -- --coverage
```

### Test Coverage

The following components have full test coverage:

- **StructuredLoggerService** - All logging methods, context management, metadata formatting
- **RequestIdMiddleware** - UUID generation, header management, request augmentation
- **GlobalExceptionFilter** - Exception handling, RFC 7807 formatting, error logging
- **HttpLoggingInterceptor** - Request/response logging, timing measurement, error handling

### Example Test

Tests verify that the observability stack works correctly:

```
✓ StructuredLoggerService (5 tests)
  ✓ should be defined
  ✓ should set and get context
  ✓ should log info level messages
  ✓ should log error level messages
  ✓ should format metadata correctly

✓ RequestIdMiddleware (6 tests)
  ✓ should be defined
  ✓ should generate a request ID if not provided
  ✓ should use existing x-request-id header if provided
  ✓ should set x-request-id header in response
  ✓ should call next middleware
  ✓ should generate unique IDs for different requests

✓ GlobalExceptionFilter (10 tests)
  ✓ should handle BadRequestException with validation errors
  ✓ should handle NotFoundException
  ✓ should include RFC 7807 required fields
  ✓ should include request ID in error response
  ✓ should format validation errors correctly

✓ HttpLoggingInterceptor (8 tests)
  ✓ should log successful response
  ✓ should measure request duration
  ✓ should handle errors from handler
  ✓ should pass through response data
  ✓ should re-throw errors after logging
```

## Best Practices

1. **Always log important operations** - Use `logger.log()` for business operations
2. **Log errors with context** - Include relevant data when logging errors
3. **Use request IDs** - Include in external service calls for tracing
4. **Structured metadata** - Pass objects for better filtering in aggregation tools
5. **Avoid logging sensitive data** - Never log passwords, tokens, or PII
6. **Test observability** - Use provided test suite to verify logging and error handling
7. **Monitor request IDs** - Include in external service calls and third-party service traces

## Documentation

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide with examples and best practices
- **[NestJS Documentation](https://docs.nestjs.com)** - NestJS framework documentation
- **[RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807)** - Standard error response format
- **[Swagger/OpenAPI](https://swagger.io)** - API documentation standard
- **[class-validator](https://github.com/typestack/class-validator)** - Request validation library
- **[class-transformer](https://github.com/typestack/class-transformer)** - Data transformation library

## Additional Resources

- [Jest Testing Framework](https://jestjs.io/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

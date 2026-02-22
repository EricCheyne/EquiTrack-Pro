# API Testing Architecture

## Component Overview

This document describes the testing architecture for the EquiTrack Pro API observability infrastructure.

## Directory Structure

```
services/api/
├── src/
│   ├── common/
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts      ← Converts exceptions to RFC 7807
│   │   ├── interceptors/
│   │   │   └── http-logging.interceptor.ts     ← Logs all HTTP requests/responses
│   │   ├── middleware/
│   │   │   └── request-id.middleware.ts        ← Generates request correlation IDs
│   │   ├── services/
│   │   │   └── structured-logger.service.ts    ← Contextual structured logging
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts              ← Request DTO validation
│   │   ├── types/
│   │   │   └── problem-details.ts              ← RFC 7807 types and helpers
│   │   ├── examples/
│   │   │   └── example-logger-usage.ts         ← Usage examples
│   │   └── tests/                              ← TEST FILES (New)
│   │       ├── global-exception.filter.spec.ts ← Exception handling tests
│   │       ├── http-logging.interceptor.spec.ts ← HTTP logging tests
│   │       ├── request-id.middleware.spec.ts   ← Request ID tests
│   │       └── structured-logger.spec.ts       ← Logger service tests
│   ├── modules/
│   │   └── health/
│   └── app.module.ts
│   └── main.ts
├── TESTING.md                                   ← New: Testing guide
├── README.md
└── package.json
```

## Test Files Summary

| Test File                          | Coverage                | Tests  | Assertions |
| ---------------------------------- | ----------------------- | ------ | ---------- |
| `structured-logger.spec.ts`        | StructuredLoggerService | 11     | 15+        |
| `request-id.middleware.spec.ts`    | RequestIdMiddleware     | 6      | 8+         |
| `global-exception.filter.spec.ts`  | GlobalExceptionFilter   | 10     | 18+        |
| `http-logging.interceptor.spec.ts` | HttpLoggingInterceptor  | 10     | 15+        |
| **Total**                          | **4 Core Components**   | **37** | **56+**    |

## Request Flow with Observability

```
HTTP Request
    ↓
[RequestIdMiddleware]
├─ Generate/Extract UUID
├─ Set x-request-id header
└─ Augment request with .id
    ↓
[HttpLoggingInterceptor] (entering)
├─ Capture start timestamp
├─ Log request via StructuredLoggerService
└─ Begin measuring duration
    ↓
[ValidationPipe]
├─ Validate DTO against schema
└─ Throw BadRequestException if invalid
    ↓
[Controller] → [Service] → [Database]
    ↓
[HttpLoggingInterceptor] (exiting)
├─ Capture end timestamp
├─ Log response with duration
└─ Calculate and track metrics
    ↓
[GlobalExceptionFilter] (if any exception)
├─ Convert to RFC 7807 Problem Details
├─ Include request ID
├─ Include validation errors
└─ Log exception
    ↓
HTTP Response (with x-request-id header)
```

## Component Interactions

### StructuredLoggerService
- **Injected Into**: Controllers, Services, Middleware, Filters, Interceptors
- **Provides**: Contextual logging with metadata formatting
- **Used By**: 
  - GlobalExceptionFilter (exception logging)
  - HttpLoggingInterceptor (request/response logging)
  - Services and Controllers (business logic logging)

### RequestIdMiddleware
- **Registered In**: AppModule.configure()
- **Executes**: For all routes (*)
- **Sets**: x-request-id header on response
- **Augments**: Express.Request with .id property
- **Used By**: All downstream components via request.id

### HttpLoggingInterceptor
- **Applied To**: Controllers (via @UseInterceptors)
- **Depends On**: StructuredLoggerService
- **Provides**: Automatic HTTP request/response logging
- **Logs**: Method, URL, status code, duration, errors

### GlobalExceptionFilter
- **Applied Globally**: In main.ts via useGlobalFilters()
- **Depends On**: StructuredLoggerService
- **Catches**: All thrown exceptions
- **Returns**: RFC 7807 Problem Details JSON
- **Includes**: Request ID, validation errors, timestamp

### ValidationPipe
- **Applied Globally**: In main.ts via ValidationPipe
- **Validates**: All DTO inputs against class-validator decorators
- **Throws**: BadRequestException with detailed error messages
- **Handled By**: GlobalExceptionFilter → Problem Details response

## Test Architecture

### Unit Testing Approach

Each component has dedicated tests that:
1. **Mock Dependencies** - Other services/middlewares are mocked
2. **Test Isolated Behavior** - Each component tested independently
3. **Verify Side Effects** - Check logging calls, header setting, etc.
4. **Use NestJS Testing Module** - Proper dependency injection
5. **Follow AAA Pattern** - Arrange, Act, Assert

### Example Test Pattern

```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let mockDependency: jest.Mocked<Dependency>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ComponentName,
        { provide: Dependency, useValue: mockDependency },
      ],
    }).compile();

    component = module.get<ComponentName>(ComponentName);
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = component.method(input);

    // Assert
    expect(result).toBe('expected');
    expect(mockDependency.method).toHaveBeenCalledWith(input);
  });
});
```

## Running Tests

```bash
# All tests
pnpm test

# Specific test file
pnpm test -- structured-logger.spec.ts

# Watch mode
pnpm test -- --watch

# Coverage report
pnpm test -- --coverage
```

## Test Execution Flow

1. **Jest Configuration** (jest.config.js)
   - Finds all `*.spec.ts` files in src/
   - Uses ts-jest for TypeScript compilation
   - Sets NODE_ENV='test'

2. **Module Setup** (beforeEach)
   - Creates NestJS testing module
   - Registers real components
   - Registers mock dependencies

3. **Test Execution**
   - Instantiates component
   - Sets up test data
   - Invokes methods
   - Verifies assertions

4. **Cleanup** (afterEach - automatic)
   - Destroys module
   - Clears mocks
   - Releases resources

## Coverage by Component

### StructuredLoggerService (src/common/services/structured-logger.spec.ts)
- ✅ Context management (setContext, resetContext)
- ✅ All 5 log level methods (log, warn, error, debug, verbose)
- ✅ HTTP logging (logRequest, logResponse)
- ✅ Metadata formatting with key=value pairs
- ✅ Error with stack traces
- ✅ Error object handling without error instance
- ✅ Metadata object nullification

### RequestIdMiddleware (src/common/tests/request-id.middleware.spec.ts)
- ✅ UUID generation when no header exists
- ✅ Using existing x-request-id header if provided
- ✅ Response header setting
- ✅ Calling next middleware
- ✅ Unique ID generation across requests
- ✅ Case-insensitive header handling

### GlobalExceptionFilter (src/common/tests/global-exception.filter.spec.ts)
- ✅ BadRequestException with validation error details
- ✅ NotFoundException handling
- ✅ Generic HttpException handling
- ✅ Generic Error handling (500 response)
- ✅ RFC 7807 required fields verification
- ✅ Request ID inclusion in response
- ✅ Request instance (path) in response
- ✅ Structured logging of exceptions
- ✅ Validation error formatting
- ✅ RFC 7807 type URL
- ✅ x-request-id header setting
- ✅ ISO 8601 timestamp format

### HttpLoggingInterceptor (src/common/tests/http-logging.interceptor.spec.ts)
- ✅ Successful response logging
- ✅ Duration measurement
- ✅ Response status code logging
- ✅ Error handling from handler
- ✅ Timing metrics capture
- ✅ Next handler invocation
- ✅ Response data pass-through
- ✅ Error re-throw after logging
- ✅ Timing precision validation
- ✅ Support for different HTTP methods

## Integration Points

### Test → Implementation Mapping

Each test verifies that the implementation:

1. **Request ID Middleware**
   - Generates UUIDs matching RFC 4122 format
   - Sets response header with correct name
   - Makes ID available to downstream components

2. **Structured Logger**
   - Formats log output consistently
   - Includes context name in every log
   - Formats metadata as key=value pairs
   - Includes stack traces for errors

3. **HTTP Logging Interceptor**
   - Captures timing without blocking
   - Logs every request/response
   - Includes metrics for observability
   - Re-throws errors after logging

4. **Exception Filter**
   - Returns valid RFC 7807 JSON
   - Includes all required fields (type, title, status, detail, instance)
   - Extracts validation errors into errors object
   - Includes request ID for tracing
   - Sets correct HTTP status codes

## Continuous Integration

Tests should pass on every commit:

```bash
# CI command
pnpm test -- --coverage --watchAll=false

# Should output something like:
# PASS  src/common/tests/structured-logger.spec.ts (1234ms)
# PASS  src/common/tests/request-id.middleware.spec.ts (567ms)
# PASS  src/common/tests/global-exception.filter.spec.ts (890ms)
# PASS  src/common/tests/http-logging.interceptor.spec.ts (756ms)
#
# Test Suites: 4 passed, 4 total
# Tests:       37 passed, 37 total
# Snapshots:   0 total
# Time:        12.345s
```

## Future Test Expansion

### Service Testing (To Add)
Tests for Property, Lease, Ledger services following the same patterns

### Integration Testing (To Add)
Tests for service + database interactions using test database

### E2E Testing (To Add)
Tests for complete HTTP request workflows

### API Testing (To Add)
Tests for controller endpoints with full request/response cycle

## Best Practices Implemented

1. ✅ **Isolated Unit Tests** - Mock all external dependencies
2. ✅ **Clear Test Names** - Describe what should happen  
3. ✅ **AAA Pattern** - Arrange, Act, Assert clearly separated
4. ✅ **Single Responsibility** - One behavior per test
5. ✅ **Mock Verification** - Verify mocks were called correctly
6. ✅ **Edge Cases** - Test error scenarios and edge cases
7. ✅ **Descriptive Assertions** - Clear failure messages
8. ✅ **Fast Execution** - Tests complete in milliseconds
9. ✅ **Independent Tests** - No dependencies between tests
10. ✅ **Documentation** - TESTING.md guide for developers

## Files Modified/Created

### New Test Files (4)
- `/src/common/tests/structured-logger.spec.ts`
- `/src/common/tests/request-id.middleware.spec.ts`
- `/src/common/tests/global-exception.filter.spec.ts`
- `/src/common/tests/http-logging.interceptor.spec.ts`

### New Documentation Files (1)
- `TESTING.md` - Complete testing guide and reference

### Modified Files (1)
- `README.md` - Added testing section and documentation links

## Related Documentation

- See [TESTING.md](./TESTING.md) for comprehensive testing guide
- See [README.md](./README.md) for API overview and usage
- See individual `.ts` files for implementation details

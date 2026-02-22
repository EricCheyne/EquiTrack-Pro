# Testing Guide

## Overview

This guide explains the testing approach for the EquiTrack Pro API. The project follows a test-driven development (TDD) approach with comprehensive unit and integration tests for all critical components.

## Testing Strategy

### Test Pyramid

```
            E2E / Integration Tests
          /                         \
        /    Feature / API Tests       \
      /                                 \
    /       Unit Tests                     \
  /                                         \
= Core Business Logic & Infrastructure =
```

### Testing Scope

1. **Unit Tests** (Primary focus)
   - Individual services, controllers, middleware, filters
   - Mock all external dependencies
   - Fast execution (<1ms per test typically)
   - Located in `src/**/*.spec.ts` files

2. **Integration Tests** (Secondary)
   - Service + Database interactions
   - Multiple components working together
   - Use test database with fixtures
   - Located in `tests/integration/` directory

3. **E2E Tests** (Tertiary)
   - Full API requests through HTTP
   - Real database for isolated test
   - Verification of complete workflows
   - Located in `tests/e2e/` directory

## Current Test Coverage

### Observability Infrastructure Tests

These tests ensure the observability stack works correctly and provides reliable logging and error handling.

#### 1. StructuredLoggerService (`structured-logger.spec.ts`)

Tests the logging service that provides contextual, structured logging:

- **Context Management**
  - `setContext()` - Sets the context name for all subsequent logs
  - `resetContext()` - Resets to default context

- **Logging Methods**
  - `log()` - Info-level logging
  - `error()` - Error-level with stack traces
  - `warn()` - Warning-level
  - `debug()` - Debug-level
  - `verbose()` - Verbose/trace-level

- **HTTP Logging**
  - `logRequest()` - Logs HTTP request details
  - `logResponse()` - Logs HTTP response with timing

- **Metadata Formatting**
  - Validates key=value format for metadata
  - Tests context inclusion in output
  - Verifies error stack traces included

#### 2. RequestIdMiddleware (`request-id.middleware.spec.ts`)

Tests the request ID generation and propagation:

- **ID Generation**
  - Generates UUID when no `x-request-id` header exists
  - Uses existing `x-request-id` header if provided
  - Generates unique IDs for each request

- **Header Management**
  - Sets `x-request-id` response header
  - Handles case-insensitive header names
  - Augments `Express.Request` with `id` property

- **Middleware Chain**
  - Calls next middleware after processing
  - Doesn't block request pipeline

#### 3. GlobalExceptionFilter (`global-exception.filter.spec.ts`)

Tests the RFC 7807 Problem Details exception handling:

- **Exception Handling**
  - `BadRequestException` - Validation errors with error details
  - `NotFoundException` - 404 not found responses
  - Generic `HttpException` - All HTTP status codes
  - `Error` - Unhandled generic errors converted to 500

- **RFC 7807 Compliance**
  - Includes `type` URL
  - Includes `title` matching HTTP status
  - Includes `status` code
  - Includes `detail` message
  - Includes `instance` request path
  - Includes `timestamp` in ISO 8601 format
  - Includes `requestId` for tracing

- **Error Details**
  - Extracts validation errors into `errors` object
  - Formats validation messages as arrays
  - Logs using StructuredLoggerService

#### 4. HttpLoggingInterceptor (`http-logging.interceptor.spec.ts`)

Tests automatic HTTP request/response logging:

- **Request/Response Logging**
  - Logs all requests entering the system
  - Logs all successful responses with status code
  - Logs timing information in milliseconds
  - Passes response data through unchanged

- **Error Handling**
  - Catches errors from handlers
  - Logs errors using StructuredLoggerService
  - Re-throws errors for exception filter
  - Works with all HTTP methods (GET, POST, PATCH, DELETE, etc.)

- **Performance Metrics**
  - Measures request duration
  - Returns accurate timing information
  - No significant performance overhead

## Running Tests

### Commands

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (rerun on file changes)
pnpm test -- --watch

# Run specific test file
pnpm test -- structured-logger.spec.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="logger"

# Generate coverage report
pnpm test -- --coverage

# Create verbose output
pnpm test -- --verbose

# Run tests with specific configuration
pnpm test -- --testPathPattern="common/tests"
```

### Configuration

Tests are configured in `jest.config.js`:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

## Writing Tests

### Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let mockDependency: jest.Mocked<MyDependency>;

  beforeEach(async () => {
    // Setup test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: MyDependency,
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = service.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking

Use Jest mocks for dependencies:

```typescript
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
} as any;

const module = await Test.createTestingModule({
  providers: [
    {
      provide: StructuredLoggerService,
      useValue: mockLogger,
    },
  ],
}).compile();
```

### Assertions

Common assertions used in tests:

```typescript
// Exact equality
expect(result).toBe(expected);
expect(result).toEqual(expected);

// Truthiness
expect(value).toBeDefined();
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(duration).toBeGreaterThan(0);
expect(duration).toBeGreaterThanOrEqual(0);
expect(count).toBeLessThan(100);

// Objects/Arrays
expect(obj).toHaveProperty('key');
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(2);
```

## Best Practices

1. **Name Tests Clearly**
   - Use descriptive test names starting with "should"
   - Example: "should log error with context and metadata"

2. **Follow AAA Pattern**
   - Arrange: Setup test data and mocks
   - Act: Call the function/method
   - Assert: Verify the results

3. **One Assertion Per Test**
   - Keep tests focused and specific
   - Multiple related assertions are OK if they test one behavior
   - Split unrelated assertions into separate tests

4. **Mock External Dependencies**
   - Mock database calls
   - Mock external service calls
   - Mock file system operations
   - Don't mock the code being tested

5. **Use Descriptive Assertions**
   - Assertion messages should explain what failed
   - Use `expect(x).toBe(y)` over `expect(Boolean(x)).toBe(true)`

6. **Keep Tests Fast**
   - Aim for tests under 10ms each
   - Mock time-consuming operations
   - Use in-memory databases for integration tests

7. **Organize Tests Logically**
   - Group related tests with `describe()` blocks
   - Use nested describes for complex components
   - Clear hierarchy from general to specific

## Example: Testing a New Controller

When creating a new controller, follow this pattern:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { StructuredLoggerService } from '@/common/services/structured-logger.service';

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let mockService: jest.Mocked<PropertiesService>;
  let mockLogger: jest.Mocked<StructuredLoggerService>;

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: PropertiesService, useValue: mockService },
        { provide: StructuredLoggerService, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  describe('create', () => {
    it('should create a property and return it', async () => {
      const createDto = { name: 'Test', type: 'LAND' };
      const result = { id: '1', ...createDto };

      mockService.create.mockResolvedValue(result);

      const response = await controller.create(createDto);

      expect(response).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const createDto = { name: 'Test', type: 'LAND' };
      const error = new Error('Service error');

      mockService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return list of properties', async () => {
      const properties = [{ id: '1', name: 'Test' }];
      mockService.findAll.mockResolvedValue(properties);

      const result = await controller.findAll();

      expect(result).toEqual(properties);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });
});
```

## Debugging Tests

### View Test Output

```bash
# Show individual test results
pnpm test -- --verbose

# Show which tests are skipped
pnpm test -- --listTests

# Stop on first test failure
pnpm test -- --bail
```

### Debug in VS Code

1. Add breakpoint in test file
2. Run: `node --inspect-brk ./node_modules/.bin/jest --runInBand`
3. Open `chrome://inspect` in Chrome browser
4. Click "Inspect" on the process

### Use Console

```typescript
it('should debug something', () => {
  const value = complexFunction();
  console.log('Debug:', value); // Visible with --verbose flag
  expect(value).toBe(expected);
});
```

## Continuous Integration

Tests should pass before merging:

```bash
# CI command - runs all tests, generates coverage
pnpm test -- --coverage --watchAll=false
```

## Coverage Goals

Current coverage includes:

- ✅ Core observability infrastructure (middleware, services, filters, interceptors)
- ⏳ Property/Lease/Ledger services (to be added)
- ⏳ Authentication guards (to be added)
- ⏳ Error handling edge cases (to be added)

Target coverage:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

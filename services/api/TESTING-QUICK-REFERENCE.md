# API Testing Quick Reference

## Running Tests

```bash
# Run all tests
pnpm test

# Run in watch mode (re-run on file changes)
pnpm test -- --watch

# Run single test file
pnpm test -- structured-logger.spec.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="logger"

# Show coverage report
pnpm test -- --coverage

# Verbose output
pnpm test -- --verbose

# Stop on first failure
pnpm test -- --bail
```

## Test File Locations

```
src/common/tests/
├── structured-logger.spec.ts          (Logger service tests)
├── request-id.middleware.spec.ts      (Request ID generation tests)
├── global-exception.filter.spec.ts    (Error handling tests)
└── http-logging.interceptor.spec.ts   (HTTP logging tests)
```

## What Each Test File Covers

### structured-logger.spec.ts
- ✅ Context setting and resetting
- ✅ All 7 logging methods (log, warn, error, debug, verbose, logRequest, logResponse)
- ✅ Metadata formatting
- ✅ Error stack trace inclusion

**Related Files**: `src/common/services/structured-logger.service.ts`

### request-id.middleware.spec.ts
- ✅ UUID generation for requests
- ✅ Using existing x-request-id headers
- ✅ Response header setting
- ✅ Unique ID per request
- ✅ Case-insensitive header handling

**Related Files**: `src/common/middleware/request-id.middleware.ts`

### global-exception.filter.spec.ts
- ✅ BadRequestException handling with validation errors
- ✅ NotFoundException, HttpException, and generic Error handling
- ✅ RFC 7807 Problem Details format compliance
- ✅ Request ID and timestamp inclusion
- ✅ Validation error extraction

**Related Files**: `src/common/filters/global-exception.filter.ts`, `src/common/types/problem-details.ts`

### http-logging.interceptor.spec.ts
- ✅ Request/response logging
- ✅ Duration measurement
- ✅ Error handling and re-throw
- ✅ Response data pass-through
- ✅ Different HTTP methods support

**Related Files**: `src/common/interceptors/http-logging.interceptor.ts`

## Quick Test Overview

| Component             | Tests  | Status     |
| --------------------- | ------ | ---------- |
| Structured Logger     | 11     | ✅ Complete |
| Request ID Middleware | 6      | ✅ Complete |
| Exception Filter      | 10     | ✅ Complete |
| HTTP Logging          | 10     | ✅ Complete |
| **Total**             | **37** | ✅ Complete |

## Key Testing Patterns

### Setup Test Module
```typescript
const module = await Test.createTestingModule({
  providers: [ServiceName, MockDependency],
}).compile();

service = module.get<ServiceName>(ServiceName);
```

### Mock Dependencies
```typescript
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
} as any;
```

### Verify Mock Calls
```typescript
expect(mockLogger.log).toHaveBeenCalledWith('message', undefined, {});
expect(mockLogger.error).toHaveBeenCalled();
```

### Test Observable Results
```typescript
mockHandler.handle.mockReturnValue(of(testData));
interceptor.intercept(context, handler);
// Then verify async operations
setTimeout(() => {
  expect(mockLogger.log).toHaveBeenCalled();
}, 10);
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(expected);
expect(object).toEqual(expectedObject);

// Truthiness
expect(value).toBeDefined();
expect(value).toBeTruthy();
expect(array).toHaveLength(3);

// Numbers
expect(duration).toBeGreaterThan(0);
expect(status).toBe(200);

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg);
expect(mockFn).toHaveBeenCalledTimes(1);

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);
```

## Debugging Tests

1. **Add logging**
   ```typescript
   console.log('Debug value:', value);
   ```

2. **Run with verbose flag**
   ```bash
   pnpm test -- --verbose
   ```

3. **Run single test**
   ```bash
   pnpm test -- --testNamePattern="should do something"
   ```

4. **Use debugger in VS Code**
   - Set breakpoint in test
   - Run: `node --inspect-brk ./node_modules/.bin/jest --runInBand`
   - Open Chrome DevTools

## Test Requirements

### Before Writing Tests
1. ✅ Install dependencies: `pnpm install`
2. ✅ Understand the component being tested
3. ✅ Identify external dependencies to mock
4. ✅ Plan test scenarios (happy path + error cases)

### While Writing Tests
1. ✅ Each test should test one behavior
2. ✅ Use descriptive test names
3. ✅ Mock all external dependencies
4. ✅ Test both success and error paths
5. ✅ Verify logging/side effects

### After Writing Tests
1. ✅ Run tests: `pnpm test`
2. ✅ Check coverage: `pnpm test -- --coverage`
3. ✅ Verify all tests pass
4. ✅ Review test names for clarity

## Example: Adding a Test

```typescript
describe('MyService', () => {
  let service: MyService;
  let mockLogger: jest.Mocked<StructuredLoggerService>;

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: StructuredLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should create item successfully', async () => {
    // Arrange
    const input = { name: 'Test' };

    // Act
    const result = await service.create(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(mockLogger.log).toHaveBeenCalledWith('Item created', undefined, {
      id: result.id,
    });
  });

  it('should handle creation errors', async () => {
    // Arrange
    const input = null;

    // Act & Assert
    await expect(service.create(input)).rejects.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
```

## Coverage Goals

```
Statements   : 80%+
Branches     : 75%+
Functions    : 80%+
Lines        : 80%+
```

## CI/CD Integration

Tests run automatically on:
- ✅ Pre-commit (if configured with husky)
- ✅ Push to branches
- ✅ Pull requests
- ✅ Release builds

Command for CI:
```bash
pnpm test -- --coverage --watchAll=false
```

## Getting Help

1. **Read TESTING.md** - Comprehensive guide with examples
2. **Check ARCHITECTURE-TESTING.md** - Visual diagrams and component relationships
3. **Review existing tests** - Use as templates for new tests
4. **Check NestJS docs** - [Testing guide](https://docs.nestjs.com/fundamentals/testing)
5. **Check Jest docs** - [Jest manual](https://jestjs.io/docs/getting-started)

## Common Issues & Solutions

### "Cannot find module '@nestjs/testing'"
```bash
pnpm install @nestjs/testing
```

### "Test timeout exceeded"
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### "Mock not being called"
```typescript
// Verify mock was set up correctly
expect(mockFn).toHaveBeenCalled();
// If fails, check if mocked dependency is actually being used
```

### "Async test not completing"
```typescript
// Return promise from test
it('should work', async () => {
  const result = await service.method();
  expect(result).toBe(expected);
});

// Or use done callback
it('should work', (done) => {
  setTimeout(() => {
    expect(value).toBe(expected);
    done();
  }, 10);
});
```

## Next Steps

1. **Run existing tests**
   ```bash
   pnpm test
   ```

2. **Review test files**
   - Open any `.spec.ts` file
   - Understand the testing pattern

3. **Create service/controller tests**
   - Follow the same AAA pattern
   - Mock the StructuredLoggerService
   - Test success and error cases

4. **Add to CI pipeline**
   - Run tests on every commit
   - Generate coverage reports
   - Fail on coverage regression

---

**More Info**: See [TESTING.md](./TESTING.md) for comprehensive testing guide
**Architecture**: See [ARCHITECTURE-TESTING.md](./ARCHITECTURE-TESTING.md) for component diagrams

# API Integration Tests

Comprehensive integration test suite for the EquiTrack Pro API using Jest, Testcontainers, and PostgreSQL.

## Overview

The integration tests verify:

✅ **Health Endpoints** - API is running and responsive (`/health`, `/health/ping`)
✅ **Database Connectivity** - Prisma can connect and query the database
✅ **CRUD Operations** - Create, read, update operations work correctly
✅ **Transactions** - Database transactions and rollback work properly
✅ **Request Correlation** - Request IDs are generated and included
✅ **Error Handling** - Constraints and validation errors are handled correctly
✅ **Smoke Tests** - Performance and reliability under normal conditions

## Quick Start

### Prerequisites

- Docker and Docker Compose (for Testcontainers backend)
- Node.js 18+
- pnpm package manager

### Running Integration Tests

```bash
# Run integration tests with Testcontainers
cd services/api
pnpm install
pnpm test:integration

# Or with docker-compose alternative
pnpm test:integration:docker
```

Both approaches automatically:
1. Start a PostgreSQL container
2. Run the integration tests
3. Stop and clean up the container

## Architecture

### Test Structure

```
test/integration/
├── setup.ts              # Global setup (starts PostgreSQL)
├── teardown.ts           # Global teardown (stops PostgreSQL)
├── helpers.ts            # Test utilities and helpers
├── health.spec.ts        # Health endpoint tests
└── database.spec.ts      # Database connectivity tests
```

### Test Flow

```
1. Jest starts with global setup
   ↓
2. setup.ts starts PostgreSQL container using Testcontainers
   ↓
3. Container details saved to environment variables
   ↓
4. Integration test suites run:
   - Health Endpoints (health.spec.ts)
   - Database Connectivity (database.spec.ts)
   ↓
5. Tests complete
   ↓
6. teardown.ts stops PostgreSQL container
```

## Two Approaches

### Option 1: Testcontainers (Default)

**Pros:**
- Automatic container lifecycle management
- No manual setup required
- Works in CI/CD pipelines
- Version-controlled container images
- Easy parallel test execution

**Cons:**
- Requires Docker daemon
- Slightly slower (container startup)
- Can't inspect container after failure

**Usage:**
```bash
pnpm test:integration
```

**Configuration:**
See `jest-integration.config.js` and `test/integration/setup.ts`

### Option 2: Docker Compose

**Pros:**
- Predictable container behavior
- Can keep container running for inspection
- Good for local debugging
- Can manually manage containers

**Cons:**
- Manual container cleanup required
- Need separate docker-compose file
- Container must be stopped before next run

**Usage:**
```bash
# Start containers and run tests
pnpm test:integration:docker

# Or manually
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Inspect database
docker-compose -f docker-compose.test.yml exec postgres psql -U testuser -d equitrack_test

# Cleanup
docker-compose -f docker-compose.test.yml down -v
```

## Test Suites

### Health Endpoint Tests (`health.spec.ts`)

Tests the health check endpoints that verify the API is running.

**Tests:**
- `GET /health` returns 200 with health status
- `GET /health/ping` returns simple 200 response
- Request IDs are generated and included in headers
- Endpoints respond in reasonable time
- Response structure is valid

**Example:**
```typescript
const response = await request(app, 'get', '/health/ping');
expect(response.status).toBe(200);
expect(response.headers['x-request-id']).toBeDefined();
```

### Database Connectivity Tests (`database.spec.ts`)

Tests database connectivity and Prisma operations.

**Tests by Category:**

**Connection Tests:**
- Basic database connection
- Raw SQL queries
- Sequential query execution

**CRUD Operations:**
- Create organizations and users
- Query organizations and users
- Update records
- Read with relations and filters
- Pagination and counting

**Advanced Operations:**
- Transactions and rollback
- Constraint violations
- Validation errors
- Concurrent queries
- Connection recovery

**Example:**
```typescript
it('should query users table', async () => {
  const users = await prisma.user.findMany();
  expect(Array.isArray(users)).toBe(true);
  expect(users.length).toBeGreaterThan(0);
});
```

## Helpers

The `test/integration/helpers.ts` file provides utilities:

### `createTestApp()`
Creates and initializes a NestJS test application with full middleware, filters, and pipes.

```typescript
const app = await createTestApp();
```

### `getPrismaClient()`
Gets a Prisma client configured with the test database.

```typescript
const prisma = getPrismaClient();
const users = await prisma.user.findMany();
```

### `setupTestContext()`
Complete setup: app + database initialization + seed data.

```typescript
const { app, prisma } = await setupTestContext();
```

### `teardownTestContext()`
Complete cleanup: database cleanup + app close + disconnect.

```typescript
await teardownTestContext(context);
```

### `request()`
Make HTTP requests to the test app.

```typescript
const response = await request(app, 'get', '/health/ping');
```

### `seedTestDatabase()`
Seed database with test data (organization + user).

```typescript
await seedTestDatabase(prisma);
```

### `cleanupTestDatabase()`
Delete all data from test database.

```typescript
await cleanupTestDatabase(prisma);
```

## Environment Variables

### Automatic Setup (Testcontainers)

When using Testcontainers, variables are automatically set:

```
DATABASE_URL=postgresql://testuser:testpass@localhost:XXXXX/equitrack_test
DATABASE_HOST=localhost
DATABASE_PORT=XXXXX
DATABASE_NAME=equitrack_test
DATABASE_USER=testuser
DATABASE_PASSWORD=testpass
NODE_ENV=test
```

Port and host are dynamically assigned.

### Manual Setup (Docker Compose)

When using docker-compose, define manually:

```env
DATABASE_URL=postgresql://testuser:testpass@postgres:5432/equitrack_test
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=equitrack_test
DATABASE_USER=testuser
DATABASE_PASSWORD=testpass
NODE_ENV=test
```

## Configuration Files

### `jest-integration.config.js`

Jest configuration for integration tests:

```javascript
module.exports = {
  displayName: 'integration',
  testRegex: 'test/integration/.*\\.spec\\.ts$',
  globalSetup: '<rootDir>/test/integration/setup.ts',
  globalTeardown: '<rootDir>/test/integration/teardown.ts',
  testTimeout: 60000, // 60 second timeout for slow operations
  verbose: true,
};
```

### `docker-compose.test.yml`

Docker Compose setup for running tests in containers:

- PostgreSQL 15 Alpine
- API container with mounted volumes
- Health checks and dependencies
- Automatic test execution

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
- name: Run Integration Tests
  run: |
    cd services/api
    pnpm install
    pnpm test:integration
```

No additional setup needed - Testcontainers handles everything!

### GitLab CI Example

```yaml
integration_tests:
  image: node:20-alpine
  services:
    - docker:dind
  script:
    - cd services/api
    - pnpm install
    - pnpm test:integration
```

## Debugging Failed Tests

### View Container Logs

```bash
# With Testcontainers (Docker)
docker logs <container-id>

# With docker-compose
docker-compose -f docker-compose.test.yml logs postgres
```

### Inspect Database

```bash
# docker-compose approach: keep container running
docker-compose -f docker-compose.test.yml up

# In another terminal
docker-compose -f docker-compose.test.yml exec postgres transactionpsql -U testuser -d equitrack_test

# Run queries
SELECT * FROM "Organization";
SELECT * FROM "User";
```

### Run Single Test Suite

```bash
# Run only health endpoint tests
pnpm test:integration -- health.spec.ts

# Run specific test
pnpm test:integration -- health.spec.ts -t "should return 200"
```

### Verbose Output

```bash
# Show detailed test output
pnpm test:integration -- --verbose

# Show failed test details
pnpm test:integration -- --verbose --bail
```

## Performance Considerations

### Testcontainers Performance

- **Container startup:** ~3-5 seconds
- **Database initialization:** ~1-2 seconds
- **Test execution:** Depends on test complexity
- **Container cleanup:** ~1-2 seconds

**Total overhead:** ~6-10 seconds per test run

### Optimization Tips

1. **Batch related tests** - Group tests by category
2. **Reuse context** - Use single app/database per test suite
3. **Avoid large datasets** - Use minimal test data
4. **Clean between tests** - Only cleanup between independent tests
5. **Use transactions** - Rollback instead of deleting

## Troubleshooting

### "Cannot connect to Docker daemon"

```bash
# Solution: Start Docker
sudo systemctl start docker

# Or use Docker Desktop
open /Applications/Docker.app
```

### "Port already in use"

```bash
# Find running container
docker ps

# Stop it
docker stop <container-id>

# Or use different port in docker-compose.test.yml
```

### "Database migration failed"

```bash
# Check Prisma schema
cd packages/db
pnpm db:generate

# Run migrations manually
pnpm db:migrate:dev --name test
```

### "Request timeout"

```
Error: Test timeout exceeded
```

**Solution:** Increase timeout in jest-integration.config.js:

```javascript
testTimeout: 120000 // Increase to 120 seconds
```

### "Connection refused"

Make sure:
1. Database is running: `docker ps`
2. Correct DATABASE_URL is set
3. Container network is accessible
4. Firewall allows connection

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
beforeSpec(() => {
  // Setup
});

afterEach(() => {
  // Cleanup
});
```

### 2. Meaningful Test Names

```typescript
// ✅ Good
it('should create user with valid email and name', async () => {});

// ❌ Bad
it('creates user', async () => {});
```

### 3. Use Test Data Builder

```typescript
// ✅ Good
const organization = await prisma.organization.create({
  data: testOrgData,
});

// ❌ Bad
const organization = await prisma.organization.create({
  data: { name: '', slug: '' }, // Unclear test data
});
```

### 4. Assert Expectations

```typescript
// ✅ Good
expect(user.role).toBe('ADMIN');
expect(user.email).toBe('test@example.com');

// ❌ Bad
expect(user).toBeDefined(); // Too vague
```

### 5. Clean Up Resources

```typescript
afterAll(async () => {
  await teardownTestContext(context);
});
```

## Adding New Integration Tests

### Template

```typescript
import { setupTestContext, teardownTestContext, TestAppContext } from './helpers';

describe('Feature Name (Integration)', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await setupTestContext();
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  describe('Scenario', () => {
    it('should verify behavior', async () => {
      // Arrange
      const data = { /* test data */ };

      // Act
      const result = await context.prisma.model.create({ data });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });
});
```

### New Feature Checklist

- [ ] Create `test/integration/feature.spec.ts`
- [ ] Use provided helpers from `helpers.ts`
- [ ] Cover happy path and error cases
- [ ] Add documentation in comments
- [ ] Run tests locally: `pnpm test:integration`
- [ ] Verify CI/CD passes

## Continuous Integration

### Recommended Setup

1. **Unit tests** run on every commit (fast)
2. **Integration tests** run on PR and main branch (slower)
3. **E2E tests** run on Release/Production deploys (slowest)

### GitHub Actions Integration

```yaml
integration_tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    - run: npm install -g pnpm
    - run: pnpm install
    - run: cd services/api && pnpm test:integration
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testcontainers](https://www.testcontainers.org/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

## Maintenance

### Updating Container Images

Update in `test/integration/setup.ts`:

```typescript
const postgresContainer = await new PostgreSqlContainer("postgres:16")
  // Version updated
```

### Database Schema Changes

When Prisma schema changes:

1. Update `packages/db/prisma/schema.prisma`
2. Run: `pnpm db:generate`
3. Run: `pnpm db:migrate:dev`
4. Tests will use new schema automatically

### Adding Test Data

Update `test/integration/helpers.ts`:

```typescript
export async function seedTestDatabase(prisma: PrismaClient) {
  // Add more test data as needed
}
```

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review test output with `--verbose` flag
3. Check Docker logs: `docker logs <container>`
4. Review Testcontainers documentation
5. Open GitHub issue with error details

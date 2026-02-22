/**
 * Integration Test Helpers
 *
 * Utilities for starting the API, connecting to database, and managing test lifecycle
 */

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { StructuredLoggerService } from "../../src/common/services/structured-logger.service";
import { GlobalExceptionFilter } from "../../src/common/filters/global-exception.filter";
import { PrismaClient } from "@equitrack/db";

/**
 * Create and start a test NestJS application
 *
 * Mirrors production configuration with test-specific settings
 */
export async function createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Apply same middleware, filters, and pipes as production
    const logger = app.get(StructuredLoggerService);

    // Add validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    // Add exception filter
    app.useGlobalFilters(new GlobalExceptionFilter(logger));

    await app.init();

    return app;
}

/**
 * Get a Prisma client configured with test database
 *
 * Uses DATABASE_URL environment variable set by Jest global setup
 */
export function getPrismaClient(): PrismaClient {
    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL environment variable not set. Make sure Jest setup completed successfully."
        );
    }

    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
}

/**
 * Seed the test database with initial data
 *
 * Creates test organization and user
 */
export async function seedTestDatabase(prisma: PrismaClient) {
    // Create test organization
    await prisma.organization.create({
        data: {
            name: "Test Farm",
            slug: "test-farm",
            users: {
                create: {
                    email: "test@example.com",
                    name: "Test User",
                    role: "ADMIN",
                },
            },
        },
    });
}

/**
 * Cleanup test database after tests
 *
 * Deletes all data to ensure clean state between tests
 */
export async function cleanupTestDatabase(prisma: PrismaClient) {
    // Delete in order of dependencies
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
}

/**
 * Test application context
 *
 * Contains app instance and Prisma client
 */
export interface TestAppContext {
    app: INestApplication;
    prisma: PrismaClient;
}

/**
 * Setup test application context
 *
 * Creates app, initializes database, and seeds with test data
 */
export async function setupTestContext(): Promise<TestAppContext> {
    const app = await createTestApp();
    const prisma = getPrismaClient();

    try {
        // Verify database connection
        await prisma.$queryRaw`SELECT 1`;

        // Seed test data
        await seedTestDatabase(prisma);

        return { app, prisma };
    } catch (error) {
        await app.close();
        await prisma.$disconnect();
        throw error;
    }
}

/**
 * Teardown test application context
 *
 * Stops app, cleans up database, and disconnects Prisma
 */
export async function teardownTestContext(context: TestAppContext) {
    try {
        await cleanupTestDatabase(context.prisma);
        await context.app.close();
        await context.prisma.$disconnect();
    } catch (error) {
        console.error("Error during test context teardown:", error);
        // Don't throw - we want test cleanup to complete
    }
}

/**
 * Make HTTP request to test app
 *
 * Helper for making requests without setting up HTTP client manually
 */
export async function request(
    app: INestApplication,
    method: string,
    path: string,
    body?: any,
    headers?: Record<string, string>
) {
    const request = app.getHttpServer()
    [method.toLowerCase()](path)
        .set("Content-Type", "application/json");

    if (headers) {
        for (const [key, value] of Object.entries(headers)) {
            request.set(key, value);
        }
    }

    if (body) {
        request.send(body);
    }

    return request;
}

/**
 * Wait for condition to be true (with timeout)
 *
 * Useful for async operations in tests
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeoutMs = 5000,
    intervalMs = 100
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        if (await condition()) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

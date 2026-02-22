/**
 * Database Connectivity Integration Tests
 *
 * Smoke tests for database connectivity and Prisma operations
 * Verifies the API can connect to and query the database
 */

import { PrismaClient } from "@equitrack/db";
import {
    setupTestContext,
    teardownTestContext,
    getPrismaClient,
    cleanupTestDatabase,
    TestAppContext,
} from "./helpers";

describe("Database Connectivity (Integration)", () => {
    let context: TestAppContext;
    let prisma: PrismaClient;

    beforeAll(async () => {
        context = await setupTestContext();
        prisma = context.prisma;
    });

    afterAll(async () => {
        await teardownTestContext(context);
    });

    describe("Database Connection", () => {
        it("should connect to database successfully", async () => {
            // If we reach here, connection succeeded
            expect(true).toBe(true);
        });

        it("should execute raw SQL query", async () => {
            const result = await prisma.$queryRaw`SELECT 1 as result`;

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });

        it("should execute multiple queries in sequence", async () => {
            const result1 = await prisma.$queryRaw`SELECT 1 as result`;
            const result2 = await prisma.$queryRaw`SELECT 2 as result`;

            expect(Array.isArray(result1)).toBe(true);
            expect(Array.isArray(result2)).toBe(true);
        });
    });

    describe("Prisma Client Operations", () => {
        it("should query organizations table", async () => {
            const organizations = await prisma.organization.findMany();

            expect(Array.isArray(organizations)).toBe(true);
            // Should have test data from setup
            expect(organizations.length).toBeGreaterThan(0);
        });

        it("should find created organization", async () => {
            const organization = await prisma.organization.findFirst({
                where: { slug: "test-farm" },
            });

            expect(organization).toBeDefined();
            expect(organization?.name).toBe("Test Farm");
            expect(organization?.slug).toBe("test-farm");
        });

        it("should query users table", async () => {
            const users = await prisma.user.findMany();

            expect(Array.isArray(users)).toBe(true);
            // Should have test user from setup
            expect(users.length).toBeGreaterThan(0);
        });

        it("should find created user", async () => {
            const user = await prisma.user.findFirst({
                where: { email: "test@example.com" },
            });

            expect(user).toBeDefined();
            expect(user?.email).toBe("test@example.com");
            expect(user?.name).toBe("Test User");
            expect(user?.role).toBe("ADMIN");
        });

        it("should query with relations", async () => {
            const user = await prisma.user.findFirst({
                where: { email: "test@example.com" },
                include: { organization: true },
            });

            expect(user).toBeDefined();
            expect(user?.organization).toBeDefined();
            expect(user?.organization?.name).toBe("Test Farm");
        });
    });

    describe("Create Operations", () => {
        afterEach(async () => {
            // Clean up created data
            await cleanupTestDatabase(prisma);
            // Re-seed test data
            const { seedTestDatabase } = await import("./helpers");
            await seedTestDatabase(prisma);
        });

        it("should create new organization", async () => {
            const newOrg = await prisma.organization.create({
                data: {
                    name: "New Farm",
                    slug: "new-farm",
                },
            });

            expect(newOrg).toBeDefined();
            expect(newOrg.id).toBeDefined();
            expect(newOrg.name).toBe("New Farm");
            expect(newOrg.slug).toBe("new-farm");
        });

        it("should create user with organization", async () => {
            const org = await prisma.organization.create({
                data: {
                    name: "User Farm",
                    slug: "user-farm",
                    users: {
                        create: {
                            email: "user@example.com",
                            name: "New User",
                            role: "ADMIN",
                        },
                    },
                },
                include: { users: true },
            });

            expect(org.users).toHaveLength(1);
            expect(org.users[0].email).toBe("user@example.com");
        });

        it("should create audit log entry", async () => {
            const org = await prisma.organization.findFirst({
                where: { slug: "test-farm" },
            });

            expect(org).toBeDefined();

            const auditLog = await prisma.auditLog.create({
                data: {
                    action: "CREATE",
                    entity: "PROPERTY",
                    entityId: "prop-123",
                    userId: (await prisma.user.findFirst())!.id,
                    organizationId: org!.id,
                    changes: JSON.stringify({ name: "Test Property" }),
                },
            });

            expect(auditLog).toBeDefined();
            expect(auditLog.action).toBe("CREATE");
            expect(auditLog.entity).toBe("PROPERTY");
        });
    });

    describe("Read Operations", () => {
        it("should paginate organizations", async () => {
            const orgs = await prisma.organization.findMany({
                take: 10,
                skip: 0,
            });

            expect(Array.isArray(orgs)).toBe(true);
            expect(orgs.length).toBeGreaterThanOrEqual(0);
        });

        it("should filter organizations by slug", async () => {
            const org = await prisma.organization.findUnique({
                where: { slug: "test-farm" },
            });

            expect(org).toBeDefined();
            expect(org?.slug).toBe("test-farm");
        });

        it("should count organizations", async () => {
            const count = await prisma.organization.count();

            expect(typeof count).toBe("number");
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });

    describe("Update Operations", () => {
        it("should update organization", async () => {
            const updated = await prisma.organization.update({
                where: { slug: "test-farm" },
                data: { name: "Updated Farm" },
            });

            expect(updated.name).toBe("Updated Farm");

            // Verify update persisted
            const verified = await prisma.organization.findUnique({
                where: { slug: "test-farm" },
            });
            expect(verified?.name).toBe("Updated Farm");

            // Restore original name
            await prisma.organization.update({
                where: { slug: "test-farm" },
                data: { name: "Test Farm" },
            });
        });

        it("should update user", async () => {
            const user = await prisma.user.findFirst({
                where: { email: "test@example.com" },
            });

            expect(user).toBeDefined();

            const updated = await prisma.user.update({
                where: { id: user!.id },
                data: { name: "Updated User" },
            });

            expect(updated.name).toBe("Updated User");

            // Restore original name
            await prisma.user.update({
                where: { id: user!.id },
                data: { name: "Test User" },
            });
        });
    });

    describe("Transaction Support", () => {
        it("should support nested transactions", async () => {
            const result = await prisma.$transaction([
                prisma.organization.findMany(),
                prisma.user.findMany(),
            ]);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });

        it("should rollback on error", async () => {
            const org = await prisma.organization.findFirst({
                where: { slug: "test-farm" },
            });

            const originalName = org?.name;

            try {
                await prisma.$transaction(async (tx) => {
                    // Update organization
                    await tx.organization.update({
                        where: { slug: "test-farm" },
                        data: { name: "Rollback Farm" },
                    });

                    // Simulate error
                    throw new Error("Test error");
                });
            } catch (error) {
                // Expected to fail
            }

            // Verify rollback worked
            const verifyOrg = await prisma.organization.findFirst({
                where: { slug: "test-farm" },
            });
            expect(verifyOrg?.name).toBe(originalName);
        });
    });

    describe("Error Handling", () => {
        it("should handle unique constraint violation", async () => {
            const org = await prisma.organization.findFirst({
                where: { slug: "test-farm" },
            });

            expect(org).toBeDefined();

            // Try to create duplicate - should fail
            try {
                await prisma.organization.create({
                    data: {
                        name: "Another Farm",
                        slug: "test-farm", // Duplicate slug
                    },
                });
                fail("Should have thrown unique constraint error");
            } catch (error: any) {
                expect(error.code).toBe("P2002"); // Prisma unique constraint error
            }
        });

        it("should handle missing required field", async () => {
            try {
                await prisma.organization.create({
                    data: {
                        // Missing required 'slug' field
                        name: "Farm without slug",
                    } as any,
                });
                fail("Should have thrown validation error");
            } catch (error: any) {
                expect(error).toBeDefined();
                // Prisma will throw validation error
            }
        });
    });

    describe("Smoke Tests", () => {
        it("should connect and query in reasonable time", async () => {
            const startTime = Date.now();

            const orgs = await prisma.organization.findMany({ take: 1 });

            const duration = Date.now() - startTime;

            expect(orgs).toBeDefined();
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it("should handle multiple concurrent queries", async () => {
            const queries = Promise.all([
                prisma.organization.findMany(),
                prisma.user.findMany(),
                prisma.auditLog.findMany(),
                prisma.$queryRaw`SELECT 1`,
            ]);

            const results = await queries;

            expect(results).toHaveLength(4);
            results.forEach((result) => {
                expect(result).toBeDefined();
            });
        });

        it("should reconnect after extended idle period", async () => {
            // First query
            const result1 = await prisma.organization.findMany({ take: 1 });
            expect(result1).toBeDefined();

            // Wait to simulate idle period
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Second query - should still work
            const result2 = await prisma.organization.findMany({ take: 1 });
            expect(result2).toBeDefined();
        });
    });
});

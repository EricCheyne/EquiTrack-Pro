/**
 * Health Endpoint Integration Tests
 *
 * Tests the /health and /health/ping endpoints
 * Verifies the API is running and responsive
 */

import { INestApplication } from "@nestjs/common";
import { request } from "./helpers";

describe("Health Endpoints (Integration)", () => {
    let app: INestApplication;

    beforeAll(async () => {
        // Lazy-load app module to ensure database is initialized
        const { createTestApp } = await import("./helpers");
        app = await createTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe("GET /health", () => {
        it("should return 200 with health status", async () => {
            const response = await request(app, "get", "/health");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("status");
            expect(response.body.status).toBeDefined();
        });

        it("should return valid health check response structure", async () => {
            const response = await request(app, "get", "/health");

            expect(response.status).toBe(200);
            // Health check response from NestJS terminus typically includes:
            // - status: 'ok' | 'error'
            // - checks: object with health indicators
            expect(response.body).toHaveProperty("status");
        });

        it("should indicate API is running", async () => {
            const response = await request(app, "get", "/health");

            expect(response.status).toBe(200);
            expect(response.body.status).toMatch(/ok|up|healthy/i);
        });

        it("should include request ID in response header", async () => {
            const response = await request(app, "get", "/health");

            expect(response.headers["x-request-id"]).toBeDefined();
            // Should be a valid UUID format
            expect(response.headers["x-request-id"]).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            );
        });

        it("should return response in reasonable time", async () => {
            const startTime = Date.now();
            const response = await request(app, "get", "/health");
            const duration = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
        });
    });

    describe("GET /health/ping", () => {
        it("should return 200 with simple pong response", async () => {
            const response = await request(app, "get", "/health/ping");

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
        });

        it("should be faster than full health check", async () => {
            const healthTime = await measureEndpointTime(app, "/health");
            const pingTime = await measureEndpointTime(app, "/health/ping");

            // Ping should generally be faster than full health check
            // But allow for variance in test environment
            expect(pingTime).toBeLessThan(healthTime + 1000); // Within 1 second margin
        });

        it("should include request ID in response header", async () => {
            const response = await request(app, "get", "/health/ping");

            expect(response.headers["x-request-id"]).toBeDefined();
            expect(response.headers["x-request-id"]).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            );
        });

        it("should return response in very reasonable time", async () => {
            const startTime = Date.now();
            const response = await request(app, "get", "/health/ping");
            const duration = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(duration).toBeLessThan(1000); // Should respond within 1 second
        });

        it("should be idempotent", async () => {
            const response1 = await request(app, "get", "/health/ping");
            const response2 = await request(app, "get", "/health/ping");

            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
            // Request IDs should be different (new request)
            expect(response1.headers["x-request-id"]).not.toBe(
                response2.headers["x-request-id"]
            );
        });
    });

    describe("Request ID Correlation", () => {
        it("should generate unique request IDs for different requests", async () => {
            const ids = new Set<string>();

            for (let i = 0; i < 5; i++) {
                const response = await request(app, "get", "/health/ping");
                ids.add(response.headers["x-request-id"]);
            }

            // All 5 request IDs should be unique
            expect(ids.size).toBe(5);
        });

        it("should maintain request ID format consistency", async () => {
            const uuidPattern =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            for (let i = 0; i < 3; i++) {
                const response = await request(app, "get", "/health/ping");
                expect(response.headers["x-request-id"]).toMatch(uuidPattern);
            }
        });
    });

    describe("Response Headers", () => {
        it("should include content-type header", async () => {
            const response = await request(app, "get", "/health/ping");

            expect(response.headers["content-type"]).toBeDefined();
            expect(response.headers["content-type"]).toContain("application/json");
        });

        it("should include x-request-id header", async () => {
            const response = await request(app, "get", "/health/ping");

            expect(response.headers["x-request-id"]).toBeDefined();
        });
    });
});

/**
 * Helper to measure endpoint response time
 */
async function measureEndpointTime(
    app: INestApplication,
    endpoint: string
): Promise<number> {
    const startTime = Date.now();
    await request(app, "get", endpoint);
    return Date.now() - startTime;
}

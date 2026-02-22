/**
 * Global Setup for Integration Tests
 *
 * Starts PostgreSQL container using Testcontainers before tests run
 * Container details are saved to environment variables for tests to access
 */

import { PostgreSqlContainer } from "testcontainers";
import * as fs from "fs";
import * as path from "path";

// Store container instance globally for teardown
let postgresContainer: PostgreSqlContainer | null = null;

/**
 * Global setup hook - called once before all tests
 */
export default async function globalSetup() {
    console.log("\n🚀 Starting PostgreSQL container for integration tests...");

    try {
        // Start PostgreSQL container with Testcontainers
        postgresContainer = await new PostgreSqlContainer("postgres:15")
            .withDatabase("equitrack_test")
            .withUsername("testuser")
            .withPassword("testpass")
            .withExposedPorts(5432)
            .start();

        const host = postgresContainer.getHost();
        const port = postgresContainer.getFirstMappedPort();
        const database = "equitrack_test";
        const username = "testuser";
        const password = "testpass";

        // Build connection string
        const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;

        // Save to environment variables for tests
        process.env.DATABASE_URL = databaseUrl;
        process.env.DATABASE_HOST = host;
        process.env.DATABASE_PORT = port.toString();
        process.env.DATABASE_NAME = database;
        process.env.DATABASE_USER = username;
        process.env.DATABASE_PASSWORD = password;

        // Also save to .env.test for reference
        const envContent = `
# Integration Test Environment (Auto-generated)
DATABASE_URL=${databaseUrl}
DATABASE_HOST=${host}
DATABASE_PORT=${port}
DATABASE_NAME=${database}
DATABASE_USER=${username}
DATABASE_PASSWORD=${password}
NODE_ENV=test
API_PORT=3001
API_HOST=localhost
`;

        const envPath = path.resolve(__dirname, "../../.env.test");
        fs.writeFileSync(envPath, envContent.trim());

        console.log(`✅ PostgreSQL container started`);
        console.log(`   Host: ${host}`);
        console.log(`   Port: ${port}`);
        console.log(`   Database: ${database}`);
        console.log(
            `   Connection: postgresql://${username}:****@${host}:${port}/${database}\n`
        );

        // Save container info globally for teardown
        (global as any).__POSTGRES_CONTAINER__ = postgresContainer;
    } catch (error) {
        console.error("❌ Failed to start PostgreSQL container:", error);
        throw error;
    }
}

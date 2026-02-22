/**
 * Global Teardown for Integration Tests
 *
 * Stops and removes PostgreSQL container after all tests complete
 * Cleans up resources to prevent container leaks
 */

/**
 * Global teardown hook - called once after all tests
 */
export default async function globalTeardown() {
    console.log("\n🧹 Cleaning up integration test environment...");

    try {
        const postgresContainer = (global as any).__POSTGRES_CONTAINER__;

        if (postgresContainer) {
            console.log("🛑 Stopping PostgreSQL container...");
            await postgresContainer.stop();
            console.log("✅ PostgreSQL container stopped\n");
        }
    } catch (error) {
        console.error("⚠️  Error during cleanup:", error);
        // Don't throw - allow tests to exit even if cleanup fails
    }
}

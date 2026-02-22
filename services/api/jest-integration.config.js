/**
 * Jest Configuration for Integration Tests
 *
 * Runs tests in test/integration/ directory
 * Uses globalSetup and globalTeardown for container management
 * Requires Docker to be running
 */

module.exports = {
    displayName: "integration",
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    testRegex: "test/integration/.*\\.spec\\.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: [
        "src/**/*.(t|j)s",
        "!src/main.ts",
        "!src/**/*.module.ts",
    ],
    coverageDirectory: "../coverage/api-integration",
    testEnvironment: "node",
    roots: ["<rootDir>"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    testTimeout: 60000,
    globalSetup: "<rootDir>/test/integration/setup.ts",
    globalTeardown: "<rootDir>/test/integration/teardown.ts",
    verbose: true,
};

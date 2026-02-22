/**
 * Jest Configuration for Unit Tests
 *
 * Runs tests in src/ directory (unit and isolated component tests)
 * Uses ts-jest for TypeScript transpilation
 */

module.exports = {
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    testRegex: ".*\\.spec\\.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: [
        "src/**/*.(t|j)s",
        "!src/main.ts",
        "!src/**/*.module.ts",
    ],
    coverageDirectory: "../coverage/api",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

# ADR-003: Use NestJS for API

**Status:** Accepted

## Context

We need a backend API framework that:
- Provides a structured, scalable architecture
- Supports TypeScript natively
- Has strong dependency injection
- Offers good testing capabilities

## Decision

We chose NestJS as our API framework.

## Consequences

**Positive:**
- Excellent TypeScript support
- Built-in dependency injection
- Strong architecture patterns (modules, services, controllers)
- Great testing utilities
- Strong community and ecosystem

**Negative:**
- Steeper learning curve for developers unfamiliar with decorators
- More boilerplate than some alternatives
- Performance overhead from abstraction layers

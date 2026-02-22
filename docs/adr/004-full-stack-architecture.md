# ADR-004: Full Stack Architecture - Prisma + PostgreSQL + Redis + Stripe + Multi-Tenancy

**Status:** Accepted

## Context

EquiTrack Pro is a multi-tenant SaaS platform for agricultural property management requiring:

- **Data Persistence:** Type-safe database access with strong schema management
- **Database:** Reliable, scalable relational database with advanced features
- **Async Processing:** Background job execution for long-running operations (e.g., report generation, email sending, webhook processing)
- **Billing:** Payment processing, subscription management, and invoicing
- **Multi-Tenancy:** Secure data isolation between customer organizations while sharing infrastructure
- **Type Safety:** End-to-end TypeScript for consistency and developer experience
- **Scalability:** Architecture that supports growth from single tenant to hundreds of organizations

We needed to select technologies that work cohesively together and align with our frontend (Next.js) and API (NestJS) choices.

## Decision

### 1. Prisma ORM for Database Access

We chose **Prisma** as our Object-Relational Mapping (ORM) solution.

**Key Features:**
- **Type-Safe:** Auto-generated TypeScript types from schema ensure compile-time safety
- **Schema-First:** Single source of truth for database schema in `schema.prisma`
- **Migrations:** Managed migrations with automatic rollback capabilities
- **Relations:** Clean API for querying related data with eager/lazy loading
- **Prisma Studio:** Built-in GUI for database inspection and editing
- **Filtering & Searching:** Rich query capabilities with sorting, pagination, and filtering

### 2. PostgreSQL 15+ for Primary Database

We chose **PostgreSQL** as our primary relational database.

**Key Features:**
- **ACID Compliance:** Strong transaction support with isolation levels
- **JSON/JSONB:** Native JSON data types for flexible schema requirements
- **Full-Text Search:** Built-in full-text search for content discovery
- **Row-Level Security (RLS):** Native support for multi-tenancy data isolation (future enhancement)
- **Indexes:** Advanced indexing strategies for performance optimization
- **Extensions:** Rich ecosystem of extensions (UUID, UUID-OSSP, pg_trgm for fuzzy search)
- **Replication:** Built-in streaming replication for high availability

### 3. Redis 7+ for Background Jobs & Caching

We chose **Redis** for:
- **Background Job Queues:** Async task processing using Bull or BullMQ
- **Session Management:** Fast session storage for API authentication
- **Rate Limiting:** Token-bucket rate limiting for API endpoints
- **Caching:** In-memory caching for frequently accessed data

**Job Queue Use Cases:**
- Email notifications
- Report generation
- Webhook event processing for Stripe
- Data export (CSV/Excel)
- Image processing and thumbnail generation
- Analytics aggregation

### 4. Stripe for Billing & Payment Processing

We chose **Stripe** for:
- **Payment Processing:** Secure credit card processing via Stripe Elements
- **Subscription Management:** Recurring billing with plans, metering, and upgrades
- **Invoicing:** Automatic invoice generation and email delivery
- **Webhooks:** Real-time event notifications (payment_intent.succeeded, customer.subscription.updated, etc.)
- **Compliance:** PCI-DSS compliance without storing sensitive card data
- **Testing:** Comprehensive test card numbers and sandbox environment

**Integration Points:**
- Customer creation linked to organizations
- Subscription tiers (Free, Professional, Enterprise)
- Metered billing for usage-based features
- Invoice history and billing statements
- Payment method management

### 5. Multi-Tenancy Architecture

We chose **Database-Per-Tenant with Shared Infrastructure** pattern:

**Architecture:**
- Single PostgreSQL database with tenant isolation via schema/table prefixing
- Tenant context is request-scoped middleware
- All queries filtered by `organizationId` at the application layer
- Audit logging tracks all changes with user and organization context

**Implementation:**
```
User → Organization (Tenant) → Feature Data
  ↓
All queries include: WHERE organizationId = $1
All mutations include: organizationId in payload
Audit logs include: userId, organizationId, timestamp
```

**Advantages:**
- Simpler operational complexity vs. database-per-tenant
- Cost-effective for SaaS model
- Easier backup/restore than managing multiple databases
- Natural billing: one subscription per organization
- Easier to implement shared features

**Security Measures:**
- Row-Level Security (RLS) policies on sensitive tables
- Request middleware validates user belongs to organization
- API endpoints require organizationId in path or headers
- Audit logging for compliance and security monitoring

## Consequences

### Positive Consequences

**1. Developer Experience**
- ✅ Type-safe end-to-end development with TypeScript
- ✅ Prisma schema is single source of truth for database structure
- ✅ Auto-generated types eliminate type mismatches
- ✅ Rich IDE autocomplete and type checking across the stack

**2. Data Integrity & Safety**
- ✅ PostgreSQL ACID guarantees prevent data corruption
- ✅ Migrations provide version control for schema changes
- ✅ Foreign key constraints maintain referential integrity
- ✅ Transactions support complex multi-step operations

**3. Operational Simplicity**
- ✅ Single database reduces operational overhead
- ✅ Shared infrastructure simplifies deployment and scaling
- ✅ Easier monitoring and debugging with single connection pool
- ✅ Simpler backup and disaster recovery procedures

**4. Business Requirements**
- ✅ Stripe integration handles all payment complexities
- ✅ Webhook support enables real-time billing updates
- ✅ Multi-tenancy enables SaaS business model
- ✅ Audit logging provides compliance and security auditing

**5. Scalability**
- ✅ PostgreSQL scales vertically well for mid-market SaaS
- ✅ Redis caching reduces database load
- ✅ Background jobs offload long-running operations
- ✅ Query optimization and indexing strategies available

**6. Cost-Effectiveness**
- ✅ Open-source technologies reduce licensing costs
- ✅ Shared database vs. database-per-tenant reduces infrastructure costs
- ✅ Stripe handles payment infrastructure (no PCI compliance burden)

### Negative Consequences

**1. Complexity Tradeoffs**
- ⚠️ Tenant isolation relies on application-layer enforcement (not database-level)
- ⚠️ Bug in tenant filtering could cause data leaks - requires extensive testing
- ⚠️ More complex queries to ensure tenant isolation
- ⚠️ Multi-tenancy debugging can be challenging

**2. Performance Considerations**
- ⚠️ All queries include WHERE organizationId filter (slight overhead)
- ⚠️ Every Prisma query must include tenant context
- ⚠️ N+1 query problems possible with nested relations
- ⚠️ Redis management overhead for job queues and caching

**3. Operational Requirements**
- ⚠️ Redis requires separate operations (backup, failover, monitoring)
- ⚠️ Background job failures need monitoring and alerting
- ⚠️ Stripe webhook processing adds complexity (idempotency, retries)
- ⚠️ Multi-database backup strategy if scaling to database-per-tenant later

**4. PostgreSQL Limitations**
- ⚠️ Vertical scaling limitations compared to distributed databases
- ⚠️ Requires database expertise for advanced features
- ⚠️ Schema migration planning needed for zero-downtime deployments

**5. Stripe Integration Complexity**
- ⚠️ Webhook security requires careful implementation
- ⚠️ Handling subscription state transitions can be complex
- ⚠️ Refund and dispute handling requires business logic
- ⚠️ Testing billing logic requires Stripe test accounts

## Alternatives Considered

### 1. ORM Alternatives to Prisma

**TypeORM**
- More mature, larger ecosystem
- More control over query generation
- Steeper learning curve
- Decided against: More boilerplate than Prisma

**Sequelize**
- Node.js specific, good abstractions
- Less type-safe than Prisma
- More verbose field definitions
- Decided against: Poor TypeScript support

**Raw SQL / No ORM**
- Full control, best performance
- High risk of SQL injection
- No schema validation
- Decided against: Sacrifices safety and developer experience

**Chose Prisma:** Best balance of type-safety, developer experience, and schema management

### 2. Database Alternatives to PostgreSQL

**MySQL/MariaDB**
- Good performance, widely known
- Fewer advanced features than PostgreSQL
- Less mature JSON support
- Decided against: PostgreSQL's advanced features are valuable

**MongoDB (NoSQL)**
- Flexible schema
- Good for unstructured data
- Poor for relational data and transactions
- Decided against: Agricultural data is highly relational

**Managed Databases (Aurora, Cloud SQL)**
- Reduced operational burden
- Higher cost
- Vendor lock-in
- Decided against: PostgreSQL self-hosted works for midmarket SaaS

**Chose PostgreSQL:** Rich features, maturity, and solid performance

### 3. Job Queue Alternatives to Redis

**Bull (on Redis)**
- Simple job queues
- In-memory data loss risk
- Decided against: Limited compared to dedicated job queues

**RabbitMQ**
- Enterprise message queue
- More complex to operate
- Overkill for SaaS at this stage
- Decided against: Redis + Bull simpler and sufficient

**AWS SQS / Google Cloud Tasks**
- Managed services (no ops)
- Vendor lock-in
- Additional costs
- Decided against: Redis gives flexibility and cost control

**Chose Redis:** Simple, performant, integrates well with monitoring

### 4. Billing Alternatives to Stripe

**Paddle**
- Good for digital products
- Less customizable
- Smaller ecosystem
- Decided against: Stripe more flexible for SaaS

**Chargebee**
- More billing-focused
- Higher pricing tiers
- Complex onboarding
- Decided against: Stripe sufficient with good documentation

**In-House Billing System**
- Full control
- Massive compliance burden
- PCI-DSS requirements
- Decided against: Too complex, Stripe best practice

**Chose Stripe:** Industry standard, excellent documentation, comprehensive feature set

### 5. Multi-Tenancy Alternatives

**Database-Per-Tenant:**
- Maximum data isolation
- Higher operational complexity
- Higher costs at scale
- Harder to build shared features
- Decided against: Overkill for current stage

**Row-Level Security (RLS) Only:**
- Database-level isolation
- Reduces app-level bugs
- Harder to debug
- PostgreSQL-specific
- Decided against: Good future enhancement but requires buy-in

**Shared Database + App Layer Isolation (CHOSEN):**
- Lower operational complexity
- Cost-effective
- Requires discipline in development
- Easy to audit
- Decided for: Best fit for current and near-term scale

## Related ADRs

- [ADR-002: Use Next.js for Frontend](./002-nextjs-frontend.md)
- [ADR-003: Use NestJS for API](./003-nestjs-api.md)
- [ADR-001: Use Turborepo for Monorepo Management](./001-turborepo-monorepo.md)

## Implementation Notes

### Schema Organization

```
schema.prisma structure:
- Core Models: User, Organization, AuditLog
- Feature Models: Properties, Leases, Payments, etc.
- All models include: createdAt, updatedAt timestamps
- All models include: organizationId for tenant isolation
```

### Multi-Tenancy Guidelines

1. **Every query must include:** `where: { organizationId }`
2. **Every mutation must include:** `organizationId in create/update payload`
3. **Middleware validates:** User belongs to requesting organization
4. **Audit logging:** All changes logged with userId and organizationId
5. **Testing:** Test cases must verify isolation between organizations

### Redis Job Queue Pattern

```typescript
// Job enqueuing
await jobQueue.add('send-email', { userId, organizationId });

// Job processing
jobQueue.process('send-email', async (job) => {
  const { userId, organizationId } = job.data;
  // Verify userId belongs to organizationId
  // Execute job
});
```

### Stripe Integration Pattern

```typescript
// Create customer for organization
const customer = await stripe.customers.create({
  email: organization.email,
  metadata: { organizationId: organization.id }
});

// Webhook handler
app.post('/webhooks/stripe', (req, res) => {
  const event = req.body;
  // Handle: customer.subscription.created, deleted, updated
  // Handle: invoice.paid, payment_intent.succeeded
  // Update local database to match Stripe state
});
```

## Migration Path for Future Growth

### If Growing Beyond Single Database

**Option 1: PostgreSQL Vertical Scaling**
- Upgrade hardware (CPU, RAM, storage)
- Add read replicas for query scaling
- Suitable for hundreds of organizations

**Option 2: Sharding**
- Shard by organizationId
- Multiple PostgreSQL instances
- Complex operational burden
- Suitable for thousands of organizations

**Option 3: Database-Per-Tenant**
- Separate database per organization
- Maximum isolation and control
- Higher operational complexity
- Suitable for enterprise customers

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Multi-Tenancy Patterns](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_SaaS_Cloud_Service_Cheat_Sheet.html)
- [Row-Level Security in PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

# @equitrack/shared

Shared types, schemas, and utilities for EquiTrack Pro using Zod for runtime validation.

## Installation

```bash
pnpm install
```

## Features

- **Zod Schemas** - Runtime validation for all DTOs
- **TypeScript Types** - Full type inference from schemas
- **Shared DTOs** - Consistent request/response formats across services
- **Enumerations** - Type-safe enum definitions

## Schemas & Types

### Property Module

Properties represent land, buildings, equipment, and other assets.

#### Types

- `PropertyStatus` - ACTIVE | INACTIVE | PENDING | SOLD
- `PropertyType` - LAND | BUILDING | EQUIPMENT | LIVESTOCK | OTHER

#### Schemas

```typescript
import {
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertySchema,
  ListPropertiesQuerySchema,
} from "@equitrack/shared";

// Create a property
const newProperty = CreatePropertySchema.parse({
  name: "North Field",
  type: "LAND",
  location: "123 Farm Road",
  acquisitionDate: new Date("2024-01-01"),
  acquisitionCost: 50000,
  currentValue: 55000,
});

// Validate query parameters
const query = ListPropertiesQuerySchema.parse({
  status: "ACTIVE",
  type: "LAND",
  take: 10,
});
```

#### Available DTOs

- `CreatePropertyDTO` - Create a new property
- `UpdatePropertyDTO` - Update existing property
- `PropertyDTO` - Response with full property data
- `ListPropertiesQueryDTO` - Query parameters for listing
- `ListPropertiesResponseDTO` - Paginated response

### Lease Module

Leases represent rental agreements for properties.

#### Types

- `LeaseStatus` - ACTIVE | EXPIRED | CANCELLED | PENDING | RENEWED
- `LeaseType` - LAND_LEASE | EQUIPMENT_LEASE | PROPERTY_LEASE | LIVESTOCK_LEASE
- `PaymentFrequency` - MONTHLY | QUARTERLY | ANNUALLY | ONE_TIME

#### Schemas

```typescript
import {
  CreateLeaseSchema,
  UpdateLeaseSchema,
  LeaseSchema,
  RecordLeasePaymentSchema,
} from "@equitrack/shared";

// Create a lease
const lease = CreateLeaseSchema.parse({
  propertyId: "prop_123",
  tenantName: "John Farmer",
  leaseType: "LAND_LEASE",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2025-01-01"),
  monthlyRent: 1000,
  paymentFrequency: "MONTHLY",
});

// Record a payment
const payment = RecordLeasePaymentSchema.parse({
  leaseId: "lease_456",
  amount: 1000,
  paymentDate: new Date(),
  paymentMethod: "TRANSFER",
});
```

#### Available DTOs

- `CreateLeaseDTO` - Create a new lease
- `UpdateLeaseDTO` - Update existing lease
- `LeaseDTO` - Response with full lease data
- `ListLeasesQueryDTO` - Query parameters for listing
- `ListLeasesResponseDTO` - Paginated response
- `RecordLeasePaymentDTO` - Record lease payment
- `LeasePaymentDTO` - Response with payment data

### Ledger Module

Ledger tracks all financial transactions and accounting records.

#### Types

- `LedgerTransactionType` - INCOME | EXPENSE | LEASE_PAYMENT | PROPERTY_MAINTENANCE | TAX | PAYROLL | INSURANCE | UTILITY | ADJUSTMENT
- `LedgerCategory` - RENTAL_INCOME | EQUIPMENT_RENTAL | REPAIRS | UTILITIES | INSURANCE | PAYROLL | TAXES | EQUIPMENT | SUPPLIES | TRANSPORTATION | PROFESSIONAL_FEES | OTHER
- `TransactionStatus` - PENDING | COMPLETED | CANCELLED | RECONCILED

#### Schemas

```typescript
import {
  CreateLedgerTransactionSchema,
  UpdateLedgerTransactionSchema,
  ListLedgerTransactionsQuerySchema,
  ReconcileLedgerSchema,
} from "@equitrack/shared";

// Create a transaction
const transaction = CreateLedgerTransactionSchema.parse({
  type: "INCOME",
  category: "RENTAL_INCOME",
  description: "Monthly rent from John Farmer",
  amount: 1000,
  transactionDate: new Date(),
  referenceId: "lease_456",
});

// List transactions with filters
const query = ListLedgerTransactionsQuerySchema.parse({
  type: "INCOME",
  category: "RENTAL_INCOME",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  take: 50,
});

// Reconcile transactions
const reconciliation = ReconcileLedgerSchema.parse({
  transactionIds: ["trans_1", "trans_2"],
  reconciliationDate: new Date(),
});
```

#### Available DTOs

- `CreateLedgerTransactionDTO` - Create a new transaction
- `UpdateLedgerTransactionDTO` - Update existing transaction
- `LedgerTransactionDTO` - Response with full transaction data
- `ListLedgerTransactionsQueryDTO` - Query parameters for listing
- `ListLedgerTransactionsResponseDTO` - Paginated response
- `LedgerSummaryDTO` - Summary statistics
- `ReconcileLedgerDTO` - Reconciliation request
- `ReconciliationResultDTO` - Reconciliation result

## Usage in API

### With NestJS

```typescript
import { Controller, Post, Body } from "@nestjs/common";
import { CreatePropertySchema, CreatePropertyDTO } from "@equitrack/shared";

@Controller("properties")
export class PropertiesController {
  @Post()
  async create(@Body() data: CreatePropertyDTO) {
    // NestJS validation pipe automatically validates using the type
    return { success: true, data };
  }
}
```

### With Zod Validation

```typescript
import { CreateLeaseSchema } from "@equitrack/shared";

try {
  const validData = CreateLeaseSchema.parse(requestBody);
  // Process valid data
} catch (error) {
  console.error("Validation error:", error.errors);
}
```

## Scripts

| Command      | Description        |
| ------------ | ------------------ |
| `pnpm build` | Compile TypeScript |
| `pnpm lint`  | Run ESLint         |

## Best Practices

1. **Always Use Schemas for Validation** - Use `.parse()` or `.safeParse()` for runtime validation
2. **Export DTOs from Index** - All DTOs should be exported from `src/index.ts`
3. **Type Safe** - Leverage TypeScript inference: `type MyDTO = z.infer<typeof MySchema>`
4. **Consistent Naming** - Use `CreateXxxDTO`, `UpdateXxxDTO`, `XxxDTO` pattern
5. **Document Descriptions** - Add `.describe()` to schema fields for API documentation

## Integration Example

```typescript
import {
  CreatePropertySchema,
  PropertyDTO,
  ListPropertiesQuerySchema,
} from "@equitrack/shared";

// In API endpoint handler
export async function handlePropertyCreate(body: unknown): Promise<PropertyDTO> {
  const validData = CreatePropertySchema.parse(body);
  const property = await db.property.create(validData);
  return property;
}

// In query handler
export async function handleListProperties(query: unknown) {
  const validQuery = ListPropertiesQuerySchema.parse(query);
  const results = await db.property.findMany({
    skip: validQuery.skip,
    take: validQuery.take,
    where: buildWhereClause(validQuery),
  });
  return results;
}
```

## Adding New Schemas

1. Create a new file in `src/schemas/` (e.g., `src/schemas/horse.ts`)
2. Define enums, create/update/response schemas
3. Export types using `z.infer<typeof Schema>`
4. Add exports to `src/index.ts`
5. Update this README with documentation

## References

- [Zod Documentation](https://zod.dev)
- [Zod Schema Validation](https://zod.dev/docs/basic-types)

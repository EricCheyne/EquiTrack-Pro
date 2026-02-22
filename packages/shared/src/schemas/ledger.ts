import { z } from "zod";

/**
 * Ledger Schemas
 * Used for validating ledger/accounting-related requests and responses
 */

export const LedgerTransactionTypeEnum = z.enum([
    "INCOME",
    "EXPENSE",
    "LEASE_PAYMENT",
    "PROPERTY_MAINTENANCE",
    "TAX",
    "PAYROLL",
    "INSURANCE",
    "UTILITY",
    "ADJUSTMENT",
]);
export type LedgerTransactionType = z.infer<typeof LedgerTransactionTypeEnum>;

export const LedgerCategoryEnum = z.enum([
    "RENTAL_INCOME",
    "EQUIPMENT_RENTAL",
    "REPAIRS",
    "UTILITIES",
    "INSURANCE",
    "PAYROLL",
    "TAXES",
    "EQUIPMENT",
    "SUPPLIES",
    "TRANSPORTATION",
    "PROFESSIONAL_FEES",
    "OTHER",
]);
export type LedgerCategory = z.infer<typeof LedgerCategoryEnum>;

export const TransactionStatusEnum = z.enum(["PENDING", "COMPLETED", "CANCELLED", "RECONCILED"]);
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;

// Create Ledger Transaction DTO
export const CreateLedgerTransactionSchema = z.object({
    type: LedgerTransactionTypeEnum.describe("Type of transaction"),
    category: LedgerCategoryEnum.describe("Transaction category"),
    description: z.string().min(1).max(500).describe("Transaction description"),
    amount: z.number().positive().describe("Transaction amount"),
    transactionDate: z.date().describe("Date of transaction"),
    referenceId: z.string().max(255).optional().describe("External reference ID (lease, property, etc)"),
    notes: z.string().max(1000).optional().describe("Additional notes"),
    status: TransactionStatusEnum.default("PENDING").describe("Transaction status"),
    tags: z.array(z.string()).default([]).describe("Tags for organization"),
});

export type CreateLedgerTransactionDTO = z.infer<typeof CreateLedgerTransactionSchema>;

// Update Ledger Transaction DTO
export const UpdateLedgerTransactionSchema = CreateLedgerTransactionSchema.partial();
export type UpdateLedgerTransactionDTO = z.infer<typeof UpdateLedgerTransactionSchema>;

// Ledger Transaction Response DTO
export const LedgerTransactionSchema = CreateLedgerTransactionSchema.extend({
    id: z.string().describe("Transaction unique identifier"),
    createdAt: z.date().describe("Creation timestamp"),
    updatedAt: z.date().describe("Last update timestamp"),
});

export type LedgerTransactionDTO = z.infer<typeof LedgerTransactionSchema>;

// List Ledger Transactions Query Parameters
export const ListLedgerTransactionsQuerySchema = z.object({
    type: LedgerTransactionTypeEnum.optional().describe("Filter by transaction type"),
    category: LedgerCategoryEnum.optional().describe("Filter by category"),
    status: TransactionStatusEnum.optional().describe("Filter by status"),
    referenceId: z.string().optional().describe("Filter by reference ID"),
    startDate: z.date().optional().describe("Filter by start date"),
    endDate: z.date().optional().describe("Filter by end date"),
    minAmount: z.number().nonnegative().optional().describe("Minimum transaction amount"),
    maxAmount: z.number().nonnegative().optional().describe("Maximum transaction amount"),
    tags: z.array(z.string()).optional().describe("Filter by tags"),
    skip: z.number().nonnegative().default(0).describe("Number of records to skip"),
    take: z.number().positive().max(100).default(20).describe("Number of records to return"),
    sortBy: z.enum(["transactionDate", "amount", "createdAt"]).default("transactionDate"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort order"),
});

export type ListLedgerTransactionsQueryDTO = z.infer<typeof ListLedgerTransactionsQuerySchema>;

export const ListLedgerTransactionsResponseSchema = z.object({
    items: z.array(LedgerTransactionSchema),
    total: z.number().describe("Total count of transactions"),
    skip: z.number(),
    take: z.number(),
});

export type ListLedgerTransactionsResponseDTO = z.infer<typeof ListLedgerTransactionsResponseSchema>;

// Ledger Summary DTO
export const LedgerSummarySchema = z.object({
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    startDate: z.date(),
    endDate: z.date(),
    totalIncome: z.number().nonnegative(),
    totalExpenses: z.number().nonnegative(),
    netProfit: z.number(),
    transactionCount: z.number(),
    byCategory: z.record(z.number()).describe("Summary by category"),
});

export type LedgerSummaryDTO = z.infer<typeof LedgerSummarySchema>;

// Reconciliation DTO
export const ReconcileLedgerSchema = z.object({
    transactionIds: z.array(z.string()).min(1).describe("Transaction IDs to reconcile"),
    reconciliationDate: z.date().describe("Date of reconciliation"),
    notes: z.string().optional().describe("Reconciliation notes"),
});

export type ReconcileLedgerDTO = z.infer<typeof ReconcileLedgerSchema>;

export const ReconciliationResultSchema = z.object({
    reconciledCount: z.number().describe("Number of transactions reconciled"),
    errors: z.array(z.string()).optional().describe("Any reconciliation errors"),
});

export type ReconciliationResultDTO = z.infer<typeof ReconciliationResultSchema>;

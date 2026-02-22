import { z } from "zod";

/**
 * Lease Schemas
 * Used for validating lease-related requests and responses
 */

export const LeaseStatusEnum = z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "PENDING", "RENEWED"]);
export type LeaseStatus = z.infer<typeof LeaseStatusEnum>;

export const LeaseTypeEnum = z.enum(["LAND_LEASE", "EQUIPMENT_LEASE", "PROPERTY_LEASE", "LIVESTOCK_LEASE"]);
export type LeaseType = z.infer<typeof LeaseTypeEnum>;

export const PaymentFrequencyEnum = z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]);
export type PaymentFrequency = z.infer<typeof PaymentFrequencyEnum>;

// Create Lease DTO
export const CreateLeaseSchema = z.object({
    propertyId: z.string().describe("Property being leased"),
    tenantName: z.string().min(1).max(255).describe("Tenant name"),
    tenantEmail: z.string().email().optional().describe("Tenant email"),
    tenantPhone: z.string().optional().describe("Tenant phone"),
    leaseType: LeaseTypeEnum.describe("Type of lease"),
    startDate: z.date().describe("Lease start date"),
    endDate: z.date().describe("Lease end date"),
    monthlyRent: z.number().positive().describe("Monthly rent amount"),
    securityDeposit: z.number().nonnegative().optional().describe("Security deposit amount"),
    paymentFrequency: PaymentFrequencyEnum.default("MONTHLY").describe("Payment frequency"),
    terms: z.string().max(2000).optional().describe("Lease terms and conditions"),
    status: LeaseStatusEnum.default("PENDING").describe("Current lease status"),
    notes: z.string().max(1000).optional().describe("Additional notes"),
});

export type CreateLeaseDTO = z.infer<typeof CreateLeaseSchema>;

// Update Lease DTO
export const UpdateLeaseSchema = CreateLeaseSchema.partial();
export type UpdateLeaseDTO = z.infer<typeof UpdateLeaseSchema>;

// Lease Response DTO
export const LeaseSchema = CreateLeaseSchema.extend({
    id: z.string().describe("Lease unique identifier"),
    nextPaymentDue: z.date().nullable().describe("Next payment due date"),
    totalPaid: z.number().nonnegative().default(0).describe("Total amount paid so far"),
    createdAt: z.date().describe("Creation timestamp"),
    updatedAt: z.date().describe("Last update timestamp"),
});

export type LeaseDTO = z.infer<typeof LeaseSchema>;

// List Leases Query Parameters
export const ListLeasesQuerySchema = z.object({
    status: LeaseStatusEnum.optional().describe("Filter by status"),
    propertyId: z.string().optional().describe("Filter by property"),
    tenantName: z.string().optional().describe("Filter by tenant name"),
    skip: z.number().nonnegative().default(0).describe("Number of records to skip"),
    take: z.number().positive().max(100).default(20).describe("Number of records to return"),
    sortBy: z.enum(["startDate", "endDate", "monthlyRent", "createdAt"]).default("startDate"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort order"),
});

export type ListLeasesQueryDTO = z.infer<typeof ListLeasesQuerySchema>;

export const ListLeasesResponseSchema = z.object({
    items: z.array(LeaseSchema),
    total: z.number().describe("Total count of leases"),
    skip: z.number(),
    take: z.number(),
});

export type ListLeasesResponseDTO = z.infer<typeof ListLeasesResponseSchema>;

// Lease Payment DTO
export const RecordLeasePaymentSchema = z.object({
    leaseId: z.string().describe("Lease being paid"),
    amount: z.number().positive().describe("Payment amount"),
    paymentDate: z.date().describe("Payment date"),
    paymentMethod: z.enum(["CASH", "CHECK", "TRANSFER", "CARD", "OTHER"]).optional().describe("Payment method"),
    transactionId: z.string().optional().describe("External transaction reference"),
    notes: z.string().max(500).optional().describe("Payment notes"),
});

export type RecordLeasePaymentDTO = z.infer<typeof RecordLeasePaymentSchema>;

export const LeasePaymentSchema = RecordLeasePaymentSchema.extend({
    id: z.string(),
    createdAt: z.date(),
});

export type LeasePaymentDTO = z.infer<typeof LeasePaymentSchema>;

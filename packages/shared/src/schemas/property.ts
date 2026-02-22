import { z } from "zod";

/**
 * Property Schemas
 * Used for validating property-related requests and responses
 */

export const PropertyStatusEnum = z.enum(["ACTIVE", "INACTIVE", "PENDING", "SOLD"]);
export type PropertyStatus = z.infer<typeof PropertyStatusEnum>;

export const PropertyTypeEnum = z.enum(["LAND", "BUILDING", "EQUIPMENT", "LIVESTOCK", "OTHER"]);
export type PropertyType = z.infer<typeof PropertyTypeEnum>;

// Create Property DTO
export const CreatePropertySchema = z.object({
    name: z.string().min(1).max(255).describe("Property name"),
    description: z.string().max(1000).optional().describe("Property description"),
    type: PropertyTypeEnum.describe("Type of property"),
    location: z.string().min(1).describe("Property location address"),
    acquisitionDate: z.date().describe("Date when property was acquired"),
    acquisitionCost: z.number().positive().describe("Cost at acquisition"),
    currentValue: z.number().nonnegative().describe("Current estimated value"),
    status: PropertyStatusEnum.default("ACTIVE").describe("Current status of property"),
});

export type CreatePropertyDTO = z.infer<typeof CreatePropertySchema>;

// Update Property DTO
export const UpdatePropertySchema = CreatePropertySchema.partial();
export type UpdatePropertyDTO = z.infer<typeof UpdatePropertySchema>;

// Property Response DTO
export const PropertySchema = CreatePropertySchema.extend({
    id: z.string().describe("Property unique identifier"),
    createdAt: z.date().describe("Creation timestamp"),
    updatedAt: z.date().describe("Last update timestamp"),
});

export type PropertyDTO = z.infer<typeof PropertySchema>;

// List Properties Query Parameters
export const ListPropertiesQuerySchema = z.object({
    status: PropertyStatusEnum.optional().describe("Filter by status"),
    type: PropertyTypeEnum.optional().describe("Filter by type"),
    skip: z.number().nonnegative().default(0).describe("Number of records to skip"),
    take: z.number().positive().max(100).default(20).describe("Number of records to return"),
    sortBy: z.enum(["name", "createdAt", "currentValue"]).default("createdAt").describe("Field to sort by"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort order"),
});

export type ListPropertiesQueryDTO = z.infer<typeof ListPropertiesQuerySchema>;

export const ListPropertiesResponseSchema = z.object({
    items: z.array(PropertySchema),
    total: z.number().describe("Total count of properties"),
    skip: z.number(),
    take: z.number(),
});

export type ListPropertiesResponseDTO = z.infer<typeof ListPropertiesResponseSchema>;

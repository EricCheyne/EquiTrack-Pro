// Re-export Prisma client and types for use in other packages
import { PrismaClient } from "@prisma/client";
export { PrismaClient };
export type {
    User,
    Org,
    Membership,
    AuditLog,
    Prisma,
} from "@prisma/client";

// Create a singleton instance for use across the application
let prismaInstance: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
    if (!prismaInstance) {
        prismaInstance = new PrismaClient();
    }
    return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
    if (prismaInstance) {
        await prismaInstance.$disconnect();
        prismaInstance = undefined;
    }
}

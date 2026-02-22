import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Create example organization
    const org = await prisma.organization.upsert({
        where: { slug: "equitrack" },
        update: {},
        create: {
            name: "EquiTrack",
            slug: "equitrack",
            description: "Default organization for EquiTrack Pro",
        },
    });

    console.log("✓ Organization seeded:", org);

    // Create example admin user
    const user = await prisma.user.upsert({
        where: { email: "admin@equitrack.local" },
        update: {},
        create: {
            email: "admin@equitrack.local",
            name: "Admin User",
            password: "CHANGE_ME_IN_PRODUCTION", // Must be hashed in real application
            role: "ADMIN",
            active: true,
        },
    });

    console.log("✓ User seeded:", user);
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log("\n✓ Database seed completed successfully");
    })
    .catch(async (e) => {
        console.error("✗ Error seeding database:", e);
        await prisma.$disconnect();
        process.exit(1);
    });

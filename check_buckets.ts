import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const buckets: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM storage.buckets;`);
    console.log("Buckets:", JSON.stringify(buckets, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

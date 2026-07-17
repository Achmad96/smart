import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`UPDATE storage.buckets SET public = true WHERE id IN ('templates', 'correspondences');`);
    console.log("Updated buckets to be public");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

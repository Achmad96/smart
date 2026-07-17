import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        headerImageUrl: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log("Recent templates:");
    console.log(JSON.stringify(templates, null, 2));

    const correspondences = await prisma.correspondence.findMany({
      select: {
        id: true,
        title: true,
        uploadedFileUrl: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log("Recent correspondences:");
    console.log(JSON.stringify(correspondences, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

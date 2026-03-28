import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const organs = await prisma.organ.count();
  const hospitals = await prisma.hospital.count();
  const alerts = await prisma.alert.count();
  
  console.log({ organs, hospitals, alerts });
}

main().catch(console.error).finally(() => prisma.$disconnect());

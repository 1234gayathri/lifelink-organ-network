import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const [hospitals, organs, requests] = await Promise.all([
    prisma.hospital.findMany(),
    prisma.organ.findMany({ include: { sourceHospital: true } }),
    prisma.organRequest.findMany()
  ]);
  
  console.log(`Total Hospitals: ${hospitals.length}`);
  console.log(`Total Organs: ${organs.length}`);
  console.log(`Total Requests: ${requests.length}`);
  
  organs.forEach((o, i) => {
    console.log(`${i+1}. ${o.organType} - Source: ${o.sourceHospital?.hospitalName || 'NONE'}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

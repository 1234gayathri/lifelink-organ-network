
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const hospital = await prisma.hospital.findUnique({
    where: { officialEmail: 'saicharishmajoga@gmail.com' }
  });
  console.log('Hospital:', hospital);
  await prisma.$disconnect();
}

checkUser();

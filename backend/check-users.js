const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.hospital.findMany({
    where: {
      officialEmail: {
        in: ['rakotisaigayathri@gmail.com', 'saicharishmajoga@gmail.com']
      }
    }
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

checkUsers();

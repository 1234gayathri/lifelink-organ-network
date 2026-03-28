import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.findFirst();
  if (hospital) {
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    await prisma.hospital.update({
      where: { id: hospital.id },
      data: { password: hashedPassword }
    });
    console.log(`Password reset for ${hospital.officialEmail} to 'Password123!'`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

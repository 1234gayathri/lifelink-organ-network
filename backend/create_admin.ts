import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const email = "admin@lifelink.org";
  const password = "AdminPass123!";
  
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  
  const admin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword
    }
  });

  console.log(`✅ Root Admin created: ${admin.email}`);
  console.log(`🔑 Password: ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

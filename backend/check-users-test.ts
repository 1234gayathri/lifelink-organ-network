import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.hospital.findMany();
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

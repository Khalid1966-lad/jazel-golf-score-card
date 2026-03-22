import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'test@test.com',
      password: hashedPassword,
      name: 'Test User',
      handicap: 18.0,
    }
  });
  
  console.log('Created user:', user.email);
  console.log('Password: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

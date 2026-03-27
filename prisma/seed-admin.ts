import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test admin user...');
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@test.com' }
  });
  
  if (existingAdmin) {
    console.log('Admin user already exists!');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    return;
  }
  
  // Create admin user
  const hashedPassword = await hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Test Admin',
      password: hashedPassword,
      isAdmin: true,
      handicap: 10.0,
      city: 'Marrakech',
      country: 'Morocco',
    }
  });
  
  console.log('Admin user created successfully!');
  console.log('Email: admin@test.com');
  console.log('Password: admin123');
  console.log('User ID:', admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

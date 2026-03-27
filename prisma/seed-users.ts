import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test users data
const testUsers = [
  {
    email: 'admin@jazel.com',
    password: 'admin123',
    name: 'Admin User',
    handicap: 12.5,
    city: 'Rabat',
    country: 'Morocco',
    isAdmin: true,
    isSuperAdmin: true,
  },
  {
    email: 'khalid@example.com',
    password: 'test123',
    name: 'Khalid Benali',
    handicap: 8.2,
    city: 'Casablanca',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'ahmed@example.com',
    password: 'test123',
    name: 'Ahmed Mansouri',
    handicap: 14.5,
    city: 'Marrakech',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'fatima@example.com',
    password: 'test123',
    name: 'Fatima Zahra',
    handicap: 18.0,
    city: 'Rabat',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'omar@example.com',
    password: 'test123',
    name: 'Omar Idrissi',
    handicap: 6.8,
    city: 'Tangier',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'sara@example.com',
    password: 'test123',
    name: 'Sara Amrani',
    handicap: 22.4,
    city: 'Agadir',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'youssef@example.com',
    password: 'test123',
    name: 'Youssef Alaoui',
    handicap: 10.1,
    city: 'Fès',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'nadia@example.com',
    password: 'test123',
    name: 'Nadia Bennis',
    handicap: 16.7,
    city: 'Marrakech',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'karim@example.com',
    password: 'test123',
    name: 'Karim Tazi',
    handicap: 4.5,
    city: 'Casablanca',
    country: 'Morocco',
    isAdmin: false,
  },
  {
    email: 'laila@example.com',
    password: 'test123',
    name: 'Laila Chraibi',
    handicap: 20.3,
    city: 'Rabat',
    country: 'Morocco',
    isAdmin: false,
  },
];

async function main() {
  console.log('Starting to seed test users...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });
    
    if (existingUser) {
      console.log(`User already exists: ${userData.email}`);
      continue;
    }
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        handicap: userData.handicap,
        city: userData.city,
        country: userData.country,
        isAdmin: userData.isAdmin || false,
        isSuperAdmin: userData.isSuperAdmin || false,
      }
    });
    
    console.log(`Created user: ${user.name} (${user.email})`);
  }
  
  console.log(`\nSuccessfully seeded test users!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

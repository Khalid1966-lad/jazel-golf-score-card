import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    DATABASE_URL: process.env.DATABASE_URL ? 'SET (starts with: ' + process.env.DATABASE_URL.substring(0, 20) + '...)' : 'NOT SET',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };
  
  return NextResponse.json(env);
}

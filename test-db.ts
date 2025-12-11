import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect(); // try connecting
    console.log('✅ Connected to the database successfully!');
    
    // Optional: list all tables in the current schema
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`;
    console.log('Tables in public schema:', result);
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

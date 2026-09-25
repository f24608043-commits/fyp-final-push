import postgres from 'postgres';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  console.log('Testing connection...');
  console.log('DATABASE_URL:', connectionString.replace(/:[^:@]+@/, ':****@'));

  try {
    const sql = postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    const result = await sql`SELECT 1 as test`;
    console.log('Connection successful:', result);
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}

testConnection();

import postgres from 'postgres';

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  console.log('Applying migration: Change direct_key from uuid to text...');

  try {
    const sql = postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    // Drop the unique constraint first
    await sql`ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_direct_key_unique`;
    console.log('Dropped unique constraint');

    // Change column type from uuid to text
    await sql`ALTER TABLE conversations ALTER COLUMN direct_key TYPE text USING direct_key::text`;
    console.log('Changed direct_key column type to text');

    // Re-add unique constraint
    await sql`ALTER TABLE conversations ADD CONSTRAINT conversations_direct_key_unique UNIQUE (direct_key)`;
    console.log('Re-added unique constraint');

    await sql.end();
    console.log('Migration applied successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();

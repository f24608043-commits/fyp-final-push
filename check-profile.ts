import { createClient } from './utils/supabase/server';
import { db } from './db';
import { profiles } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: tsx check-profile.ts <email>');
    process.exit(1);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
  const foundUser = data.users.find((u: any) => u.email === email);
  if (!foundUser) {
    console.log('No user found with email:', email);
    process.exit(0);
  }
  console.log('User found:', foundUser.id, foundUser.email);
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, foundUser.id)).limit(1);
  if (profile) {
    console.log('Profile found:', profile);
  } else {
    console.log('No profile found for user id:', foundUser.id);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestUsers() {
  console.log('🌱 Seeding test users for Playwright tests...');

  const testUsers = [
    {
      email: 'learner@example.com',
      password: 'password123',
      displayName: 'Test Learner',
      role: 'learner',
    },
    {
      email: 'tutor@example.com',
      password: 'password123',
      displayName: 'Test Tutor',
      role: 'tutor',
    },
  ];

  for (const user of testUsers) {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', user.displayName)
        .single();

      if (existingUser) {
        console.log(`✅ User ${user.email} already exists`);
        continue;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`❌ Failed to create auth user ${user.email}:`, authError);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          display_name: user.displayName,
          role: user.role,
        });

      if (profileError) {
        console.error(`❌ Failed to create profile for ${user.email}:`, profileError);
        continue;
      }

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error);
    }
  }

  console.log('\n🎉 Test users seeded successfully!');
}

seedTestUsers().catch(console.error);

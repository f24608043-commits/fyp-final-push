import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetTestPasswords() {
  console.log('Resetting test user passwords...\n');

  const users = [
    { email: 'testlearner+test@gmail.com', password: 'Test123456!', role: 'learner' },
    { email: 'orphix.itsolutions@gmail.com', password: 'Qasim.11', role: 'tutor' },
    { email: 'alexabraham587@gmail.com', password: 'Qasim.11', role: 'admin' }
  ];

  for (const user of users) {
    try {
      console.log(`Processing ${user.email} (${user.role})...`);

      // Get user by email
      const { data: { users: foundUsers }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error(`  Error listing users:`, listError);
        continue;
      }

      const targetUser = foundUsers.find(u => u.email === user.email);

      if (!targetUser) {
        console.log(`  User not found, creating...`);
        
        // Create user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            role: user.role
          }
        });

        if (createError) {
          console.error(`  Error creating user:`, createError);
          continue;
        }

        console.log(`  ✓ User created: ${newUser.user.id}`);
      } else {
        console.log(`  User found: ${targetUser.id}`);
        
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          targetUser.id,
          { password: user.password }
        );

        if (updateError) {
          console.error(`  Error updating password:`, updateError);
          continue;
        }

        console.log(`  ✓ Password updated`);
      }
    } catch (error) {
      console.error(`  Error processing ${user.email}:`, error);
    }
  }

  console.log('\n✓ Password reset complete');
}

resetTestPasswords().catch(console.error);

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function run() {
  console.log("=== Resetting Test User Passwords Directly ===\n");

  const users = [
    { email: "testlearner+test@gmail.com", password: "Test123456!", role: "learner" },
    { email: "orphix.itsolutions@gmail.com", password: "Qasim.11", role: "tutor" },
    { email: "alexabraham587@gmail.com", password: "Qasim.11", role: "admin" }
  ];

  for (const user of users) {
    try {
      console.log(`Processing ${user.email}...`);

      // Check if user exists
      const [existingUser] = await sql`
        SELECT id, email, encrypted_password
        FROM auth.users
        WHERE email = ${user.email}
      `;

      if (!existingUser) {
        console.log(`  User not found, creating...`);
        
        // Create user with raw SQL (bypassing email confirmation)
        const { randomUUID } = await import("crypto");
        const userId = randomUUID();
        
        // Simple password hash (for testing only - not production safe)
        // In production, use proper bcrypt/scrypt
        await sql`
          INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
          VALUES (
            ${userId},
            ${user.email},
            crypt(${user.password}, gen_salt('bf')),
            NOW(),
            ${JSON.stringify({ display_name: user.email.split('@')[0] })},
            NOW(),
            NOW()
          )
        `;

        // Create profile
        await sql`
          INSERT INTO profiles (id, display_name, role, xp, streak_count, onboarding_done)
          VALUES (${userId}, ${user.email.split('@')[0]}, ${user.role}, 0, 0, true)
        `;

        console.log(`  ✓ User created: ${userId}`);
      } else {
        console.log(`  User found: ${existingUser.id}`);
        
        // Update password directly
        await sql`
          UPDATE auth.users
          SET encrypted_password = crypt(${user.password}, gen_salt('bf')),
              updated_at = NOW()
          WHERE id = ${existingUser.id}
        `;

        // Update profile role
        await sql`
          INSERT INTO profiles (id, display_name, role, xp, streak_count, onboarding_done)
          VALUES (${existingUser.id}, ${user.email.split('@')[0]}, ${user.role}, 0, 0, true)
          ON CONFLICT (id) DO UPDATE SET
            role = ${user.role},
            display_name = ${user.email.split('@')[0]},
            onboarding_done = true
        `;

        console.log(`  ✓ Password updated`);
      }
    } catch (error) {
      console.error(`  Error processing ${user.email}:`, error);
    }
  }

  console.log("\n✓ Password reset complete");
  await sql.end();
}

run().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});

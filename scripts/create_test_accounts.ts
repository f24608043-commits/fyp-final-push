import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

// Use anon key for signup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function run() {
  console.log("=== Create Test Accounts with Known Passwords ===\n");

  const { randomUUID } = await import("crypto");

  const accounts = [
    { email: "testlearner+test@gmail.com", password: "Test123456!", displayName: "Test Learner", role: "learner" },
    { email: "orphix.itsolutions@gmail.com", password: "Qasim.11", displayName: "Test Tutor", role: "tutor" },
    { email: "alexabraham587@gmail.com", password: "Qasim.11", displayName: "Test Admin", role: "admin" },
  ];

  for (const account of accounts) {
    try {
      // Check if user exists in auth
      const [existingUser] = await sql`
        SELECT id, email
        FROM auth.users
        WHERE email = ${account.email}
      `;

      if (existingUser) {
        console.log(`⚠ User already exists: ${account.email}`);
        console.log(`  Deleting from auth.users and profiles...`);
        
        await sql`DELETE FROM profiles WHERE id = ${existingUser.id}`;
        await sql`DELETE FROM auth.users WHERE id = ${existingUser.id}`;
        console.log(`  ✓ Deleted`);
      }

      // Create user using Supabase auth.signup with anon key
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            display_name: account.displayName,
          },
        },
      });

      if (signupError) {
        console.log(`  ✗ Signup error: ${signupError.message}`);
        continue;
      }

      if (signupData.user) {
        // Manually confirm email in database
        await sql`
          UPDATE auth.users
          SET email_confirmed_at = NOW()
          WHERE id = ${signupData.user.id}
        `;

        // Create/update profile
        await sql`
          INSERT INTO profiles (id, display_name, role, xp, streak_count, onboarding_done)
          VALUES (${signupData.user.id}, ${account.displayName}, ${account.role}, 0, 0, true)
          ON CONFLICT (id) DO UPDATE SET
            role = ${account.role},
            display_name = ${account.displayName},
            onboarding_done = true
        `;

        console.log(`  ✓ User created and confirmed: ${signupData.user.id}`);
      }

      console.log(`✓ Created: ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log(`  Role: ${account.role}`);

    } catch (error) {
      console.log(`✗ Error with ${account.email}:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test Accounts Created:");
  console.log("=".repeat(60));
  console.log("\n📧 testlearner+test@gmail.com");
  console.log("   Password: Test123456!");
  console.log("   Role: learner");
  console.log("\n📧 orphix.itsolutions@gmail.com");
  console.log("   Password: Qasim.11");
  console.log("   Role: tutor");
  console.log("\n📧 alexabraham587@gmail.com");
  console.log("   Password: Qasim.11");
  console.log("   Role: admin");
  console.log("\n" + "=".repeat(60));

  await sql.end();
}

run().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});

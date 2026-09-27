import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testLogin() {
  console.log("=== Testing Login ===\n");

  const accounts = [
    { email: "testlearner+test@gmail.com", password: "Test123456!" },
    { email: "orphix.itsolutions@gmail.com", password: "Qasim.11" },
    { email: "alexabraham587@gmail.com", password: "Qasim.11" },
  ];

  for (const account of accounts) {
    console.log(`Testing: ${account.email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (error) {
      console.log(`  ✗ Error: ${error.message}`);
    } else {
      console.log(`  ✓ Success! User ID: ${data.user?.id}`);
      await supabase.auth.signOut();
    }
  }
}

testLogin().catch(console.error);

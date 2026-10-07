import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeClient(): SupabaseClient<any, "public", any> {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

async function checkLogin(label: string, email: string, password: string) {
  const client = makeClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.log(`✗ ${label} (${email}): FAILED - ${error.message}`);
    return;
  }
  console.log(`✓ ${label} (${email}): OK -> role session created, user id ${data.user?.id}`);
}

async function main() {
  const attempts: Array<[string, string, string]> = [
    ["ADMIN", "alexabraham587@gmail.com", "Qasim.11"],
    ["TUTOR (orphix)", "orphix.itsolutions@gmail.com", "Qasim.11"],
    ["LEARNER (nutech)", "F24608052@nutech.edu.pk", "Qasim.11"],
    ["LEARNER (testlearner)", "testlearner+test@gmail.com", "Test123456!"],
  ];
  for (const [label, email, password] of attempts) {
    await checkLogin(label, email, password);
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
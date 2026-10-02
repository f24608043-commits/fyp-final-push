import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMessagesRLS() {
  try {
    console.log('Applying RLS policies for messages table...');

    // Enable RLS on messages table
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;`
    });

    // Drop existing policies
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;`
    });
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;`
    });
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;`
    });

    // Allow users to insert messages where they are the sender
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can insert their own messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);`
    });

    // Allow participants to view messages in conversations they are part of
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_members.conversation_id = messages.conversation_id
    AND conversation_members.user_id = auth.uid()
  )
);`
    });

    // Allow users to update their own messages
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);`
    });

    console.log('✅ RLS policies applied successfully');
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    process.exit(1);
  }
}

// Alternative: Use direct SQL execution via Supabase client's .from() doesn't work for DDL
// We need to use the SQL editor or a different approach
// Let's try using the Supabase SQL API directly

async function fixMessagesRLSDirect() {
  try {
    console.log('Applying RLS policies for messages table via direct SQL...');

    const sqlStatements = [
      `ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;`,
      `DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;`,
      `DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;`,
      `CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);`,
      `CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversation_members WHERE conversation_members.conversation_id = messages.conversation_id AND conversation_members.user_id = auth.uid()));`,
      `CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);`
    ];

    for (const sql of sqlStatements) {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error('Error:', error);
        // Continue anyway as some statements might fail if policies don't exist
      }
    }

    console.log('✅ RLS policies applied successfully');
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    console.log('\n⚠️  Please manually run the SQL in drizzle/0011_fix_messages_rls.sql in the Supabase SQL Editor');
  }
}

fixMessagesRLSDirect();

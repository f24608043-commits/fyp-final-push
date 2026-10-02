import { createClient } from "@/utils/supabase/server";

async function enableMessagesRealtime() {
  const supabase = await createClient();

  try {
    // Enable Realtime replication for messages table
    const { data, error } = await supabase.rpc('enable_realtime_for_messages');

    if (error) {
      console.error('Error enabling Realtime:', error);
      throw error;
    }

    console.log('Realtime replication enabled for messages table:', data);
  } catch (error) {
    console.error('Failed to enable Realtime:', error);
    
    // Fallback: Try using SQL directly if RPC doesn't exist
    try {
      const { error: sqlError } = await supabase
        .from('_realtime')
        .select('*')
        .limit(1);
      
      console.log('Realtime status check:', sqlError ? 'Not accessible' : 'Accessible');
    } catch (e) {
      console.log('Manual SQL required. Please run in Supabase SQL Editor:');
      console.log('ALTER PUBLICATION supabase_realtime ADD TABLE messages;');
    }
  }
}

enableMessagesRealtime().catch(console.error);

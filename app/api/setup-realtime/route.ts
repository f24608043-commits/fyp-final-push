import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    const results: string[] = [];

    // 1. Create insert_message function
    try {
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION public.insert_message(
          conversation_id uuid,
          sender_id uuid,
          body text
        )
        RETURNS uuid AS $$
        DECLARE
          new_id uuid;
        BEGIN
          INSERT INTO public.messages (id, conversation_id, sender_id, body, created_at)
          VALUES (gen_random_uuid(), conversation_id, sender_id, body, now())
          RETURNING id INTO new_id;
          RETURN new_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        GRANT EXECUTE ON FUNCTION public.insert_message(uuid, uuid, text) TO anon, authenticated, service_role;
      `);
      results.push("insert_message function verified/created");
    } catch (e: any) {
      results.push(`insert_message error: ${e.message}`);
    }

    // 2. Set REPLICA IDENTITY FULL on real-time tables
    const realtimeTables = [
      "messages",
      "conversations",
      "conversation_members",
      "friendships",
      "notifications",
      "session_requests",
      "tutor_sessions",
    ];

    for (const table of realtimeTables) {
      try {
        await db.execute(sql.raw(`ALTER TABLE public.${table} REPLICA IDENTITY FULL;`));
        results.push(`Set REPLICA IDENTITY FULL on ${table}`);
      } catch (e: any) {
        results.push(`REPLICA IDENTITY on ${table}: ${e.message}`);
      }
    }

    // 3. Add tables to supabase_realtime publication
    for (const table of realtimeTables) {
      try {
        await db.execute(sql.raw(`ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};`));
        results.push(`Added ${table} to supabase_realtime publication`);
      } catch (e: any) {
        // Table might already be in publication
        results.push(`Publication for ${table}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Realtime infrastructure initialized",
      details: results,
    });
  } catch (error: any) {
    console.error("Setup realtime error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    // Create tutor_group_members table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tutor_group_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        group_id uuid NOT NULL,
        learner_id uuid NOT NULL,
        enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
        status text DEFAULT 'active' NOT NULL,
        CONSTRAINT tutor_group_members_group_id_learner_id_unique UNIQUE(group_id, learner_id)
      )
    `);

    // Create tutor_groups table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tutor_groups (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        tutor_id uuid NOT NULL,
        name text NOT NULL,
        description text,
        subject text,
        level text,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);

    // Create tutor_group_sessions table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tutor_group_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        group_id uuid NOT NULL,
        meeting_url text NOT NULL,
        start_time timestamp with time zone NOT NULL,
        end_time timestamp with time zone,
        status text DEFAULT 'scheduled' NOT NULL,
        jitsi_room_id text,
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);

    // Add foreign keys if they don't exist
    try {
      await db.execute(sql`
        ALTER TABLE tutor_group_members 
        ADD CONSTRAINT tutor_group_members_group_id_tutor_groups_id_fk 
        FOREIGN KEY (group_id) REFERENCES tutor_groups(id) ON DELETE cascade
      `);
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await db.execute(sql`
        ALTER TABLE tutor_group_members 
        ADD CONSTRAINT tutor_group_members_learner_id_profiles_id_fk 
        FOREIGN KEY (learner_id) REFERENCES profiles(id) ON DELETE cascade
      `);
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await db.execute(sql`
        ALTER TABLE tutor_groups 
        ADD CONSTRAINT tutor_groups_tutor_id_profiles_id_fk 
        FOREIGN KEY (tutor_id) REFERENCES profiles(id) ON DELETE cascade
      `);
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await db.execute(sql`
        ALTER TABLE tutor_group_sessions 
        ADD CONSTRAINT tutor_group_sessions_group_id_tutor_groups_id_fk 
        FOREIGN KEY (group_id) REFERENCES tutor_groups(id) ON DELETE cascade
      `);
    } catch (e) {
      // Constraint might already exist
    }

    return NextResponse.json({ success: true, message: "Tutoring tables created successfully" });
  } catch (error) {
    console.error("Error creating tutoring tables:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

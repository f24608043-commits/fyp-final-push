-- Create types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_session_status') THEN
        CREATE TYPE "public"."group_session_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutor_enrollment_status') THEN
        CREATE TYPE "public"."tutor_enrollment_status" AS ENUM('pending', 'accepted', 'rejected', 'removed');
    END IF;
END $$;

-- Create tables if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_enrollments') THEN
        CREATE TABLE "tutor_enrollments" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "tutor_id" uuid NOT NULL,
            "learner_id" uuid NOT NULL,
            "status" "tutor_enrollment_status" DEFAULT 'pending' NOT NULL,
            "message" text,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT "tutor_enrollments_tutor_id_learner_id_unique" UNIQUE("tutor_id","learner_id")
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_group_members') THEN
        CREATE TABLE "tutor_group_members" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "group_id" uuid NOT NULL,
            "learner_id" uuid NOT NULL,
            "enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT "tutor_group_members_group_id_learner_id_unique" UNIQUE("group_id","learner_id")
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_group_sessions') THEN
        CREATE TABLE "tutor_group_sessions" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "group_id" uuid NOT NULL,
            "meeting_url" text NOT NULL,
            "start_time" timestamp with time zone NOT NULL,
            "end_time" timestamp with time zone,
            "status" "group_session_status" DEFAULT 'scheduled' NOT NULL,
            "jitsi_room_id" text,
            "notes" text,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_groups') THEN
        CREATE TABLE "tutor_groups" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "tutor_id" uuid NOT NULL,
            "name" text NOT NULL,
            "description" text,
            "is_active" boolean DEFAULT true NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );
    END IF;
END $$;

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_enrollments_tutor_id_profiles_id_fk') THEN
        ALTER TABLE "tutor_enrollments" ADD CONSTRAINT "tutor_enrollments_tutor_id_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_enrollments_learner_id_profiles_id_fk') THEN
        ALTER TABLE "tutor_enrollments" ADD CONSTRAINT "tutor_enrollments_learner_id_profiles_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_group_members_group_id_tutor_groups_id_fk') THEN
        ALTER TABLE "tutor_group_members" ADD CONSTRAINT "tutor_group_members_group_id_tutor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."tutor_groups"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_group_members_learner_id_profiles_id_fk') THEN
        ALTER TABLE "tutor_group_members" ADD CONSTRAINT "tutor_group_members_learner_id_profiles_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_group_sessions_group_id_tutor_groups_id_fk') THEN
        ALTER TABLE "tutor_group_sessions" ADD CONSTRAINT "tutor_group_sessions_group_id_tutor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."tutor_groups"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_groups_tutor_id_profiles_id_fk') THEN
        ALTER TABLE "tutor_groups" ADD CONSTRAINT "tutor_groups_tutor_id_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
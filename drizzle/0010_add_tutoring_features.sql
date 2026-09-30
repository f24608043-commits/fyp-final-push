-- Add new columns to existing tables for tutoring features

-- Add ranking fields to profiles (check if columns exist first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rank_level') THEN
        ALTER TABLE "profiles" ADD COLUMN "rank_level" integer DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rank_points') THEN
        ALTER TABLE "profiles" ADD COLUMN "rank_points" integer DEFAULT 0;
    END IF;
END $$;

-- Add category to badges
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'category') THEN
        ALTER TABLE "badges" ADD COLUMN "category" text;
    END IF;
END $$;

-- Add tutor awarding fields to user_badges
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'awarded_by_tutor_id') THEN
        ALTER TABLE "user_badges" ADD COLUMN "awarded_by_tutor_id" uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_badges' AND column_name = 'context') THEN
        ALTER TABLE "user_badges" ADD COLUMN "context" text;
    END IF;
END $$;

-- Add foreign key for awarded_by_tutor_id (if constraint doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_badges_awarded_by_tutor_id_profiles_id_fk') THEN
        ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_awarded_by_tutor_id_profiles_id_fk" FOREIGN KEY ("awarded_by_tutor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;

-- Add extended fields to tutor_enrollments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_enrollments' AND column_name = 'started_at') THEN
        ALTER TABLE "tutor_enrollments" ADD COLUMN "started_at" timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_enrollments' AND column_name = 'ended_at') THEN
        ALTER TABLE "tutor_enrollments" ADD COLUMN "ended_at" timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_enrollments' AND column_name = 'metadata') THEN
        ALTER TABLE "tutor_enrollments" ADD COLUMN "metadata" jsonb;
    END IF;
END $$;

-- Add subject and level to tutor_groups (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_groups') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_groups' AND column_name = 'subject') THEN
            ALTER TABLE "tutor_groups" ADD COLUMN "subject" text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_groups' AND column_name = 'level') THEN
            ALTER TABLE "tutor_groups" ADD COLUMN "level" text;
        END IF;
    END IF;
END $$;

-- Add status to tutor_group_members (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_group_members') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_status') THEN
            CREATE TYPE "public"."group_member_status" AS ENUM('active', 'removed', 'inactive');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_group_members' AND column_name = 'status') THEN
            ALTER TABLE "tutor_group_members" ADD COLUMN "status" "group_member_status" DEFAULT 'active' NOT NULL;
        END IF;
    END IF;
END $$;

-- Add ranking fields to tutor_profiles (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_profiles' AND column_name = 'experience_years') THEN
            ALTER TABLE "tutor_profiles" ADD COLUMN "experience_years" integer DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_profiles' AND column_name = 'rank_level') THEN
            ALTER TABLE "tutor_profiles" ADD COLUMN "rank_level" integer DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_profiles' AND column_name = 'rank_points') THEN
            ALTER TABLE "tutor_profiles" ADD COLUMN "rank_points" integer DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_profiles' AND column_name = 'total_learners') THEN
            ALTER TABLE "tutor_profiles" ADD COLUMN "total_learners" integer DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_profiles' AND column_name = 'active_learners') THEN
            ALTER TABLE "tutor_profiles" ADD COLUMN "active_learners" integer DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_profiles' AND column_name = 'badges_awarded_count') THEN
            ALTER TABLE "tutor_profiles" ADD COLUMN "badges_awarded_count" integer DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Add type, title, meeting_url, recording_url to tutor_sessions (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutor_sessions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_sessions' AND column_name = 'type') THEN
            ALTER TABLE "tutor_sessions" ADD COLUMN "type" text DEFAULT 'one_to_one' NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_sessions' AND column_name = 'title') THEN
            ALTER TABLE "tutor_sessions" ADD COLUMN "title" text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_sessions' AND column_name = 'meeting_url') THEN
            ALTER TABLE "tutor_sessions" ADD COLUMN "meeting_url" text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tutor_sessions' AND column_name = 'recording_url') THEN
            ALTER TABLE "tutor_sessions" ADD COLUMN "recording_url" text;
        END IF;
    END IF;
END $$;

-- Create new tables for tasks and learner stats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_target_type') THEN
        CREATE TYPE "public"."task_target_type" AS ENUM('learner', 'classroom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE "public"."task_status" AS ENUM('assigned', 'submitted', 'graded', 'overdue');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "learner_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"total_enrollments" integer DEFAULT 0,
	"active_enrollments" integer DEFAULT 0,
	"completed_tasks" integer DEFAULT 0,
	"badges_earned_count" integer DEFAULT 0,
	"attendance_rate" integer DEFAULT 0,
	"average_task_score" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learner_stats_learner_id_unique" UNIQUE("learner_id")
);

CREATE TABLE IF NOT EXISTS "task_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" uuid NOT NULL,
	"target_type" "task_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"status" "task_status" DEFAULT 'assigned' NOT NULL,
	"attachments" jsonb,
	"feedback" text,
	"grade" integer,
	"score" integer,
	"submitted_at" timestamp with time zone,
	"graded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign keys for new tables (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'learner_stats_learner_id_profiles_id_fk') THEN
        ALTER TABLE "learner_stats" ADD CONSTRAINT "learner_stats_learner_id_profiles_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_submissions_task_id_tasks_id_fk') THEN
        ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'task_submissions_learner_id_profiles_id_fk') THEN
        ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_learner_id_profiles_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_tutor_id_profiles_id_fk') THEN
        ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tutor_id_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

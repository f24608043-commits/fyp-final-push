CREATE TYPE "public"."group_member_status" AS ENUM('active', 'removed', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('assigned', 'submitted', 'graded', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."task_target_type" AS ENUM('learner', 'classroom');--> statement-breakpoint
CREATE TABLE "learner_stats" (
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
--> statement-breakpoint
CREATE TABLE "task_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"learner_id" uuid NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
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
--> statement-breakpoint
ALTER TABLE "badges" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "rank_level" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "rank_points" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tutor_enrollments" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tutor_enrollments" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tutor_enrollments" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "tutor_group_members" ADD COLUMN "status" "group_member_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "tutor_groups" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "tutor_groups" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "tutor_profiles" ADD COLUMN "experience_years" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tutor_profiles" ADD COLUMN "rank_level" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tutor_profiles" ADD COLUMN "rank_points" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tutor_profiles" ADD COLUMN "total_learners" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tutor_profiles" ADD COLUMN "active_learners" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tutor_profiles" ADD COLUMN "badges_awarded_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tutor_sessions" ADD COLUMN "type" text DEFAULT 'one_to_one' NOT NULL;--> statement-breakpoint
ALTER TABLE "tutor_sessions" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "tutor_sessions" ADD COLUMN "meeting_url" text;--> statement-breakpoint
ALTER TABLE "tutor_sessions" ADD COLUMN "recording_url" text;--> statement-breakpoint
ALTER TABLE "user_badges" ADD COLUMN "awarded_by_tutor_id" uuid;--> statement-breakpoint
ALTER TABLE "user_badges" ADD COLUMN "context" text;--> statement-breakpoint
ALTER TABLE "learner_stats" ADD CONSTRAINT "learner_stats_learner_id_profiles_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_learner_id_profiles_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tutor_id_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_awarded_by_tutor_id_profiles_id_fk" FOREIGN KEY ("awarded_by_tutor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
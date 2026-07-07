CREATE TYPE "public"."activity_type" AS ENUM('signal_received', 'signal_processing_started', 'signal_classified', 'signal_processing_completed', 'signal_processing_failed', 'signal_skipped', 'pattern_detected', 'customer_created', 'customer_updated', 'agent_run_started', 'agent_run_completed', 'agent_run_failed', 'alert_created', 'alert_deduped', 'alert_skipped', 'risk_flagged', 'action_proposed', 'action_executed', 'action_failed', 'action_undone', 'autonomy_changed');--> statement-breakpoint
CREATE TYPE "public"."action_status" AS ENUM('proposed', 'approved', 'executed', 'rejected', 'undone');--> statement-breakpoint
CREATE TYPE "public"."agent_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('triage', 'pattern', 'risk', 'intelligence');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('spike', 'churn_risk', 'escalation', 'pattern');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('route_ticket', 'create_jira', 'slack_escalation', 'email_csm', 'daily_digest');--> statement-breakpoint
CREATE TYPE "public"."autonomy_level" AS ENUM('observe', 'suggest', 'auto');--> statement-breakpoint
CREATE TYPE "public"."customer_tier" AS ENUM('free', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('slack', 'zendesk', 'freshdesk', 'typeform', 'google_forms', 'gong', 'email');--> statement-breakpoint
CREATE TYPE "public"."pipeline_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."pipeline_trigger" AS ENUM('new_signal', 'scheduled', 'manual', 'retroactive');--> statement-breakpoint
CREATE TYPE "public"."signal_relation_type" AS ENUM('same_customer', 'same_topic', 'same_feature', 'escalation', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."signal_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."signal_source" AS ENUM('zendesk', 'intercom', 'freshdesk', 'typeform', 'google_forms', 'gong', 'chorus', 'product_analytics', 'social', 'email', 'slack');--> statement-breakpoint
CREATE TYPE "public"."signal_status" AS ENUM('new', 'triaged', 'processed', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."signal_type" AS ENUM('bug', 'feature_request', 'complaint', 'question', 'praise', 'churn_risk', 'other');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"entity_type" text,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_action" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"pipeline_run_id" text,
	"action_type" "action_type" NOT NULL,
	"status" "action_status" DEFAULT 'proposed' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"payload" jsonb,
	"undo_payload" jsonb,
	"approved_by" text,
	"executed_at" timestamp,
	"undone_at" timestamp,
	"undone_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_action" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agent_run" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"pipeline_run_id" text,
	"pipeline_step" integer,
	"signal_id" text,
	"agent_type" "agent_type" NOT NULL,
	"status" "agent_run_status" DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "alert" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"signal_id" text,
	"agent_run_id" text,
	"type" "alert_type" NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" jsonb,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviter_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"last_login_method" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "autonomy_rule" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"action_type" "action_type" NOT NULL,
	"autonomy_level" "autonomy_level" DEFAULT 'observe' NOT NULL,
	"auto_approve_threshold" integer DEFAULT 10 NOT NULL,
	"manual_approval_count" integer DEFAULT 0 NOT NULL,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"tier" "customer_tier",
	"company" text,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"signal_count" integer DEFAULT 0 NOT NULL,
	"risk_score" real DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "integration" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" "integration_type" NOT NULL,
	"status" "integration_status" DEFAULT 'active' NOT NULL,
	"credentials" jsonb,
	"config" jsonb,
	"last_sync_at" timestamp,
	"retroactive_sync_days" integer DEFAULT 90,
	"retroactive_sync_status" text,
	"retroactive_sync_started_at" timestamp,
	"retroactive_sync_completed_at" timestamp,
	"historical_signal_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_run" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"triggered_by" "pipeline_trigger" NOT NULL,
	"trigger_signal_id" text,
	"status" "pipeline_status" DEFAULT 'pending' NOT NULL,
	"steps_completed" integer DEFAULT 0 NOT NULL,
	"total_steps" integer DEFAULT 4 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pipeline_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "signal_relation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"source_signal_id" text NOT NULL,
	"target_signal_id" text NOT NULL,
	"relation_type" "signal_relation_type" NOT NULL,
	"strength" real DEFAULT 0.5 NOT NULL,
	"metadata" jsonb,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signal" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"integration_id" text,
	"customer_id" text,
	"external_id" text,
	"source" "signal_source" NOT NULL,
	"type" "signal_type",
	"priority" "signal_priority",
	"status" "signal_status" DEFAULT 'new' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"customer_email" text,
	"customer_name" text,
	"metadata" jsonb,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"role" text,
	"source" text,
	"metadata" jsonb,
	"contacted" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action" ADD CONSTRAINT "agent_action_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action" ADD CONSTRAINT "agent_action_pipeline_run_id_pipeline_run_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action" ADD CONSTRAINT "agent_action_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_action" ADD CONSTRAINT "agent_action_undone_by_user_id_fk" FOREIGN KEY ("undone_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_pipeline_run_id_pipeline_run_id_fk" FOREIGN KEY ("pipeline_run_id") REFERENCES "public"."pipeline_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_run" ADD CONSTRAINT "agent_run_signal_id_signal_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_signal_id_signal_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_agent_run_id_agent_run_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert" ADD CONSTRAINT "alert_acknowledged_by_user_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_rule" ADD CONSTRAINT "autonomy_rule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autonomy_rule" ADD CONSTRAINT "autonomy_rule_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration" ADD CONSTRAINT "integration_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_run" ADD CONSTRAINT "pipeline_run_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_run" ADD CONSTRAINT "pipeline_run_trigger_signal_id_signal_id_fk" FOREIGN KEY ("trigger_signal_id") REFERENCES "public"."signal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_relation" ADD CONSTRAINT "signal_relation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_relation" ADD CONSTRAINT "signal_relation_source_signal_id_signal_id_fk" FOREIGN KEY ("source_signal_id") REFERENCES "public"."signal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_relation" ADD CONSTRAINT "signal_relation_target_signal_id_signal_id_fk" FOREIGN KEY ("target_signal_id") REFERENCES "public"."signal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal" ADD CONSTRAINT "signal_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "organization_isolation" ON "activity_log" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "organization_isolation" ON "agent_action" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "organization_isolation" ON "customer" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "organization_isolation" ON "pipeline_run" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_tenant', true));--> statement-breakpoint
CREATE POLICY "organization_isolation" ON "signal" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_tenant', true));
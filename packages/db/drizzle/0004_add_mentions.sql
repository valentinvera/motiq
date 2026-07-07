CREATE TYPE "public"."mention_entity_type" AS ENUM('signal', 'alert');--> statement-breakpoint
CREATE TABLE "mention" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "entity_type" "mention_entity_type" NOT NULL,
  "entity_id" text NOT NULL,
  "mentioned_user_id" text NOT NULL,
  "mentioned_by_user_id" text NOT NULL,
  "message" text,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "mention" ADD CONSTRAINT "mention_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mention" ADD CONSTRAINT "mention_mentioned_user_id_user_id_fk" FOREIGN KEY ("mentioned_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mention" ADD CONSTRAINT "mention_mentioned_by_user_id_user_id_fk" FOREIGN KEY ("mentioned_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mention_org_entity_idx" ON "mention" USING btree ("organization_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "mention_user_unread_idx" ON "mention" USING btree ("organization_id","mentioned_user_id","read_at");--> statement-breakpoint
ALTER TABLE "mention" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "organization_isolation" ON "mention" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_tenant', true));

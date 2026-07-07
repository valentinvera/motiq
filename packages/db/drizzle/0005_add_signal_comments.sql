CREATE TABLE "signal_comment" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "signal_id" text NOT NULL,
  "author_user_id" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "signal_comment" ADD CONSTRAINT "signal_comment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_comment" ADD CONSTRAINT "signal_comment_signal_id_signal_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_comment" ADD CONSTRAINT "signal_comment_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "signal_comment_signal_idx" ON "signal_comment" USING btree ("organization_id","signal_id","created_at");--> statement-breakpoint
ALTER TABLE "signal_comment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "organization_isolation" ON "signal_comment" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.current_tenant', true));

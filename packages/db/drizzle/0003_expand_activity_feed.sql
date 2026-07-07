DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'signal_received'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'signal_received';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'signal_processing_started'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'signal_processing_started';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'signal_processing_completed'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'signal_processing_completed';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'signal_processing_failed'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'signal_processing_failed';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'signal_skipped'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'signal_skipped';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'customer_created'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'customer_created';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'customer_updated'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'customer_updated';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'agent_run_started'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'agent_run_started';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'agent_run_completed'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'agent_run_completed';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'agent_run_failed'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'agent_run_failed';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'alert_created'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'alert_created';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'alert_deduped'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'alert_deduped';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'alert_skipped'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'alert_skipped';
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'action_failed'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'action_failed';
  END IF;
END $$;

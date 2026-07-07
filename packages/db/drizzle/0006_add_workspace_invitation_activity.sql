DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'activity_type'
      AND e.enumlabel = 'workspace_invitation_canceled'
  ) THEN
    ALTER TYPE "public"."activity_type" ADD VALUE 'workspace_invitation_canceled';
  END IF;
END $$;

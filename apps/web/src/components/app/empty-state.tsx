import { Button } from "@motiq/ui/components/button"
import { Link } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  message: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({
  icon: Icon,
  message,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <Icon className="size-6 text-zinc-600" />
      </div>
      <p className="max-w-xs text-sm text-zinc-500 leading-relaxed">
        {message}
      </p>
      {actionLabel && actionHref && (
        <Button
          asChild
          className="mt-4 rounded-lg border-white/[0.08] bg-white/[0.04] font-medium text-xs text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          size="sm"
          variant="outline"
        >
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  )
}

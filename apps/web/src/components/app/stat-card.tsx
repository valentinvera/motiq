import { Link } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  iconColor?: string
  href?: string
  loading?: boolean
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-zinc-500",
  href,
  loading,
}: StatCardProps) {
  const content = (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-xl backdrop-blur-xl transition-all hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="absolute -top-12 -right-12 size-24 rounded-full bg-white/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.02]" />

      <div className="relative z-10 mb-4 flex items-center justify-between">
        <span className="font-medium text-[11px] text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={
            "flex size-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] transition-colors group-hover:border-white/20 group-hover:bg-white/5"
          }
        >
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      </div>

      <div className="relative z-10 flex items-baseline gap-2">
        <p className="font-medium text-4xl text-white tabular-nums tracking-tighter">
          {loading ? (
            <span className="inline-block h-10 w-16 animate-pulse rounded-lg bg-white/[0.06]" />
          ) : (
            value
          )}
        </p>
      </div>

      <div className="relative z-10 mt-4 h-px w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full bg-white/40 transition-all duration-1000"
          style={{ width: loading ? "30%" : "100%" }}
        />
      </div>
    </div>
  )

  if (href) {
    return (
      <Link className="block" to={href}>
        {content}
      </Link>
    )
  }
  return content
}

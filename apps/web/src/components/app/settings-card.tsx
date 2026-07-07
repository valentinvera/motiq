import type { ReactNode } from "react"

export function SettingsCard({
  title,
  description,
  footerNote,
  footerAction,
  children,
}: {
  title: string
  description: string
  footerNote?: string
  footerAction?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-start justify-between gap-6 p-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[15px] text-zinc-100">{title}</h3>
          <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">
            {description}
          </p>
          {children}
        </div>
      </div>
      {footerNote || footerAction ? (
        <div className="flex items-center justify-between gap-3 border-white/[0.06] border-t bg-white/[0.01] px-6 py-3">
          <p className="text-[11px] text-zinc-500">{footerNote}</p>
          {footerAction}
        </div>
      ) : null}
    </div>
  )
}

export function ComingSoonPanel({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] border-dashed bg-white/[0.01] py-16">
      <div className="flex size-10 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
        {icon}
      </div>
      <div className="text-center">
        <p className="font-medium text-sm text-zinc-300">{title}</p>
        <p className="mt-1 max-w-xs text-[12px] text-zinc-500">{description}</p>
      </div>
    </div>
  )
}

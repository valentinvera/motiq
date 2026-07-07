const priorityColors: Record<string, string> = {
  critical:
    "border-red-500/30 bg-red-500/5 text-red-400 [--dot-color:var(--color-red-500)]",
  high: "border-orange-500/30 bg-orange-500/5 text-orange-400 [--dot-color:var(--color-orange-500)]",
  medium:
    "border-amber-500/30 bg-amber-500/5 text-amber-400 [--dot-color:var(--color-amber-500)]",
  low: "border-blue-500/30 bg-blue-500/5 text-blue-400 [--dot-color:var(--color-blue-500)]",
}

const typeColors: Record<string, string> = {
  bug: "border-signal-bug/30 bg-signal-bug/5 text-signal-bug [--dot-color:var(--signal-bug)]",
  feature_request:
    "border-signal-feature/30 bg-signal-feature/5 text-signal-feature [--dot-color:var(--signal-feature)]",
  complaint:
    "border-signal-complaint/30 bg-signal-complaint/5 text-signal-complaint [--dot-color:var(--signal-complaint)]",
  question:
    "border-signal-question/30 bg-signal-question/5 text-signal-question [--dot-color:var(--signal-question)]",
  praise:
    "border-signal-praise/30 bg-signal-praise/5 text-signal-praise [--dot-color:var(--signal-praise)]",
  churn_risk:
    "border-red-500/30 bg-red-500/5 text-red-400 [--dot-color:var(--color-red-500)]",
  other:
    "border-zinc-500/30 bg-zinc-500/5 text-zinc-400 [--dot-color:var(--color-zinc-500)]",
}

const typeLabels: Record<string, string> = {
  bug: "Bug",
  feature_request: "Feature",
  complaint: "Complaint",
  question: "Question",
  praise: "Praise",
  churn_risk: "Churn Risk",
  other: "Other",
}

const statusColors: Record<string, string> = {
  new: "border-blue-500/30 bg-blue-500/5 text-blue-400 [--dot-color:var(--color-blue-500)]",
  triaged:
    "border-purple-500/30 bg-purple-500/5 text-purple-400 [--dot-color:var(--color-purple-500)]",
  processed:
    "border-green-500/30 bg-green-500/5 text-green-400 [--dot-color:var(--color-green-500)]",
  ignored:
    "border-zinc-500/30 bg-zinc-500/5 text-zinc-400 [--dot-color:var(--color-zinc-500)]",
  actioned:
    "border-amber-500/30 bg-amber-500/5 text-amber-400 [--dot-color:var(--color-amber-500)]",
  resolved:
    "border-green-500/30 bg-green-500/5 text-green-400 [--dot-color:var(--color-green-500)]",
}

const severityColors: Record<string, string> = {
  critical:
    "border-severity-critical/30 bg-severity-critical/5 text-severity-critical [--dot-color:var(--severity-critical)]",
  high: "border-severity-high/30 bg-severity-high/5 text-severity-high [--dot-color:var(--severity-high)]",
  medium:
    "border-severity-medium/30 bg-severity-medium/5 text-severity-medium [--dot-color:var(--severity-medium)]",
  low: "border-severity-low/30 bg-severity-low/5 text-severity-low [--dot-color:var(--severity-low)]",
}

const fallback =
  "border-zinc-800 bg-zinc-900 text-zinc-500 [--dot-color:var(--color-zinc-700)]"

function BadgePill({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide shadow-sm ${className}`}
    >
      <span className="size-1 rounded-full bg-[var(--dot-color)] shadow-[0_0_8px_var(--dot-color)]" />
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <BadgePill className={priorityColors[priority] ?? fallback}>
      {priority}
    </BadgePill>
  )
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <BadgePill className={typeColors[type] ?? fallback}>
      {typeLabels[type] ?? type}
    </BadgePill>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <BadgePill className={statusColors[status] ?? fallback}>{status}</BadgePill>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <BadgePill className={severityColors[severity] ?? fallback}>
      {severity}
    </BadgePill>
  )
}

const pipelineStatusColors: Record<string, string> = {
  pending:
    "border-zinc-500/30 bg-zinc-500/5 text-zinc-400 [--dot-color:var(--color-zinc-500)]",
  running:
    "border-blue-500/30 bg-blue-500/5 text-blue-400 [--dot-color:var(--color-blue-500)]",
  completed:
    "border-green-500/30 bg-green-500/5 text-green-400 [--dot-color:var(--color-green-500)]",
  failed:
    "border-red-500/30 bg-red-500/5 text-red-400 [--dot-color:var(--color-red-500)]",
}

export function PipelineStatusBadge({ status }: { status: string }) {
  return (
    <BadgePill className={pipelineStatusColors[status] ?? fallback}>
      {status}
    </BadgePill>
  )
}

const agentTypeColors: Record<string, string> = {
  triage:
    "border-purple-500/30 bg-purple-500/5 text-purple-400 [--dot-color:var(--color-purple-500)]",
  pattern:
    "border-cyan-500/30 bg-cyan-500/5 text-cyan-400 [--dot-color:var(--color-cyan-500)]",
  risk: "border-red-500/30 bg-red-500/5 text-red-400 [--dot-color:var(--color-red-500)]",
  intelligence:
    "border-amber-500/30 bg-amber-500/5 text-amber-400 [--dot-color:var(--color-amber-500)]",
}

export function AgentTypeBadge({ type }: { type: string }) {
  return (
    <BadgePill className={agentTypeColors[type] ?? fallback}>{type}</BadgePill>
  )
}

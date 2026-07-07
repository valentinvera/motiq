import { PuzzlePieceIcon } from "@heroicons/react/24/outline"
import { Button } from "@motiq/ui/components/button"
import { DiscordIcon } from "@motiq/ui/icons/discord"
import { GmailIcon } from "@motiq/ui/icons/gmail"
import { JiraIcon } from "@motiq/ui/icons/jira"
import { LinearIcon } from "@motiq/ui/icons/linear"
import { NotionIcon } from "@motiq/ui/icons/notion"
import { PolarIcon } from "@motiq/ui/icons/polar"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TelegramIcon } from "@motiq/ui/icons/telegram"
import { ZendeskIcon } from "@motiq/ui/icons/zendesk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRightIcon, CheckIcon, PuzzleIcon } from "lucide-react"
import type { ComponentType } from "react"
import { toast } from "sonner"
import { usePermission } from "@/lib/permissions"
import { SettingsTabSkeleton } from "@/routes/_authenticated/settings"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/settings/apps")({
  head: () => ({
    meta: [{ title: "Apps | Motiq" }],
  }),
  component: AppsTab,
})

const ICONS: Record<
  string,
  { Icon: ComponentType<{ className?: string }>; accent: string; name: string }
> = {
  slack: {
    Icon: SlackIcon,
    accent: "text-violet-400",
    name: "Slack",
  },
  discord: {
    Icon: DiscordIcon,
    accent: "text-indigo-500",
    name: "Discord",
  },
  telegram: {
    Icon: TelegramIcon,
    accent: "text-sky-400",
    name: "Telegram",
  },
  gmail: {
    Icon: GmailIcon,
    accent: "text-red-400",
    name: "Gmail",
  },
  notion: {
    Icon: NotionIcon,
    accent: "text-zinc-300",
    name: "Notion",
  },
  linear: {
    Icon: LinearIcon,
    accent: "text-violet-300",
    name: "Linear",
  },
  jira: {
    Icon: JiraIcon,
    accent: "text-blue-400",
    name: "Jira",
  },
  zendesk: {
    Icon: ZendeskIcon,
    accent: "text-white",
    name: "Zendesk",
  },
  polar: {
    Icon: PolarIcon,
    accent: "text-blue-300",
    name: "Polar",
  },
  email: {
    Icon: GmailIcon,
    accent: "text-zinc-300",
    name: "Email forwarding",
  },
  google_forms: {
    Icon: GmailIcon,
    accent: "text-red-400",
    name: "Google Forms",
  },
}

function AppsTab() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const list = useQuery(trpc.apps.list.queryOptions())
  const canManageApps = usePermission("app", "delete")
  const disconnectApp = useMutation(
    trpc.apps.delete.mutationOptions({
      onSuccess: () => {
        toast.success("App disconnected")
        queryClient.invalidateQueries({
          queryKey: trpc.apps.list.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to disconnect app")
      },
    })
  )

  if (list.isLoading) {
    return <SettingsTabSkeleton />
  }

  const connected = (list.data ?? []).filter((i) => i.status === "active")

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-start justify-between gap-4 p-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[15px] text-zinc-100">
            Connected apps
          </h3>
          <p className="mt-1.5 text-[13px] text-zinc-500 leading-relaxed">
            Apps and data sources connected to this workspace.
          </p>
        </div>
        {canManageApps ? (
          <Button
            asChild
            className="h-8 shrink-0 rounded-md border-white/[0.08] bg-white/[0.04] px-3 font-medium text-xs text-zinc-300 hover:bg-white/[0.06]"
            size="sm"
            variant="outline"
          >
            <Link to="/apps">
              Browse all
              <ArrowRightIcon className="ml-1 size-3" />
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="divide-y divide-white/[0.06] border-white/[0.06] border-t">
        {connected.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02]">
              <PuzzlePieceIcon className="size-5 text-zinc-500" />
            </div>
            <div>
              <p className="font-medium text-sm text-zinc-300">
                No apps connected
              </p>
              <p className="mt-1 text-[12px] text-zinc-500">
                {canManageApps
                  ? "Connect Slack and other sources to start ingesting signals."
                  : "Ask an owner or admin to connect feedback sources for this workspace."}
              </p>
            </div>
            {canManageApps ? (
              <Button
                asChild
                className="mt-1 h-8 rounded-md bg-white px-3 font-medium text-black text-xs hover:bg-white/90"
                size="sm"
              >
                <Link to="/apps">Connect an app</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          connected.map((item) => {
            const meta = ICONS[item.type] ?? {
              Icon: PuzzleIcon,
              accent: "text-zinc-400",
              name: item.type,
            }
            return (
              <div
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
                key={item.id}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-zinc-950">
                  <meta.Icon className={`size-4 ${meta.accent}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm text-zinc-200">
                    {meta.name}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500 capitalize">
                    {item.type.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-1 font-medium text-[10px] text-emerald-400">
                    <CheckIcon className="size-3" />
                    Connected
                  </span>
                  {canManageApps ? (
                    <Button
                      className="h-7 cursor-pointer rounded-md border-red-500/20 bg-red-500/[0.06] px-2.5 font-medium text-[10px] text-red-400 hover:bg-red-500/[0.12] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        disconnectApp.isPending &&
                        disconnectApp.variables?.id === item.id
                      }
                      onClick={() => disconnectApp.mutate({ id: item.id })}
                      size="sm"
                      variant="outline"
                    >
                      {disconnectApp.isPending &&
                      disconnectApp.variables?.id === item.id
                        ? "Disconnecting..."
                        : "Disconnect"}
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

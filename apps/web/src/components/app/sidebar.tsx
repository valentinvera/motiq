import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  LinkIcon,
  PlusIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SignalIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { Button } from "@motiq/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@motiq/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@motiq/ui/components/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@motiq/ui/components/tooltip"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { getMediaUrl } from "@/lib/media"
import { useTRPC } from "@/utils/trpc"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"

const navItems = [
  { label: "Overview", href: "/overview", icon: Squares2X2Icon },
  { label: "Reports", href: "/reports", icon: ChartPieIcon },
  { label: "Signals", href: "/signals", icon: SignalIcon },
  { label: "Activity", href: "/activity", icon: ChartBarSquareIcon },
  { label: "Pipelines", href: "/pipelines", icon: LinkIcon },
  { label: "Autonomy", href: "/autonomy", icon: ShieldCheckIcon },
  { label: "Apps", href: "/apps", icon: PuzzlePieceIcon },
  { label: "Alerts", href: "/alerts", icon: BellIcon },
  { label: "Settings", href: "/settings", icon: Cog6ToothIcon },
]

function getNavUnreadCount(
  label: string,
  counts: { alerts: number; autonomy: number; signals: number }
) {
  if (label === "Alerts") {
    return counts.alerts
  }

  if (label === "Signals") {
    return counts.signals
  }

  if (label === "Autonomy") {
    return counts.autonomy
  }

  return 0
}

function MotiqLogo() {
  return (
    // <svg
    //   className={className}
    //   viewBox="250 250 524 524"
    //   xmlns="http://www.w3.org/2000/svg"
    // >
    //   <path
    //     d="M469.123596,676.897461 C463.831482,671.561035 458.676392,666.576782 453.829468,661.309021 C451.538391,658.819092 449.111969,658.065735 445.864014,658.431396 C390.924194,664.615051 340.442688,629.341919 328.184509,575.925781 C320.170563,541.004211 327.274261,508.608612 345.514099,478.226807 C354.174561,463.801239 364.851837,451.129120 377.741516,440.354034 C380.792267,437.803741 381.045959,435.062866 380.196869,431.482147 C374.982819,409.493530 375.983307,387.842499 384.839661,366.915009 C399.471680,332.339569 424.925201,309.878418 461.725098,301.964539 C495.674622,294.663635 527.078857,302.890167 556.070557,321.275238 C568.392334,329.089081 579.290894,338.581696 588.654114,349.786163 C590.551819,352.057068 592.676941,352.856598 595.644409,352.529083 C655.779724,345.891449 707.586304,386.355286 715.093018,446.196136 C719.637390,482.421387 708.299133,514.500366 687.908691,543.905579 C681.133789,553.675659 673.094910,562.335083 663.954163,569.938293 C661.306824,572.140320 660.183228,574.245728 661.047607,578.052612 C667.259277,605.410156 664.252625,631.719238 650.536377,656.366577 C632.382019,688.988953 604.377808,707.135193 567.410522,711.367004 C536.981018,714.850464 509.973206,705.322449 484.878876,688.933044 C479.425964,685.371704 474.306854,681.386963 469.123596,676.897461 M481.487946,504.907715 C480.597900,508.072571 477.748474,511.110138 481.398743,514.442139 C493.026550,525.056152 505.708038,534.078491 520.071777,540.648743 C524.061218,542.473633 527.289673,542.051880 530.189636,538.414551 C539.903442,526.231079 547.883240,513.070679 553.666077,498.568695 C555.101868,494.968079 554.666260,492.269165 551.690552,489.715057 C539.281799,479.064392 525.404968,471.134155 509.725189,466.335114 C506.300110,465.286804 504.219727,466.296906 502.024841,468.891327 C493.104156,479.435547 486.372955,491.189667 481.487946,504.907715 M517.183411,405.064514 C528.658875,408.640350 539.810669,412.944855 550.009827,419.447113 C551.211670,420.213318 552.668030,421.403473 554.089905,420.118744 C555.421082,418.915955 554.777893,417.276276 554.105896,415.947693 C551.702820,411.196381 549.451599,406.342712 546.693054,401.800995 C531.069519,376.078369 508.944336,362.076721 478.038544,364.288025 C458.316986,365.699127 440.177185,380.287292 434.859528,399.074738 C434.221619,401.328552 432.398743,404.053253 434.521027,406.098175 C436.422394,407.930176 438.976105,406.307922 441.145966,405.681824 C466.159424,398.464172 491.228790,397.279297 517.183411,405.064514 M558.288330,645.686462 C576.848083,645.274536 599.549500,632.022461 605.585999,611.617859 C606.195679,609.557129 607.617859,607.400696 606.069641,605.466187 C604.270752,603.218506 601.822998,604.516846 599.591614,605.093811 C579.549316,610.275818 559.318176,611.945862 538.803284,608.336426 C521.401611,605.274780 505.189636,599.033875 489.922241,590.207092 C488.435303,589.347351 486.742737,587.463562 484.997864,588.937622 C483.069275,590.566895 484.631287,592.632629 485.350555,594.425598 C487.405823,599.548523 490.102112,604.366150 493.198364,608.892273 C508.638489,631.462830 528.793274,645.943787 558.288330,645.686462 M644.003479,508.506287 C648.803711,501.238922 652.372559,493.390594 655.091614,485.132812 C660.868408,467.589081 660.403137,450.440308 651.676697,433.898407 C646.624695,424.321625 639.225037,417.107666 629.200867,412.785706 C625.466553,411.175690 623.872192,412.392731 624.230591,416.460480 C624.317078,417.443024 624.655090,418.402679 624.867798,419.374939 C629.625183,441.121826 632.019714,462.934082 627.354919,485.064301 C623.863953,501.625610 617.879028,517.227905 610.098755,532.201477 C609.023010,534.271790 607.086792,536.337708 609.336914,539.398682 C624.067749,532.892639 634.407349,521.656555 644.003479,508.506287 M412.513611,537.146179 C412.729675,534.663208 412.777191,532.151978 413.188934,529.701904 C416.022095,512.842957 421.171936,496.756348 429.334381,481.678070 C430.307526,479.880371 431.905609,478.081757 430.343597,475.394287 C425.345459,476.061676 421.745392,479.346558 418.061127,482.265686 C394.643250,500.820007 380.356689,524.069885 383.456451,554.951660 C385.299072,573.309448 394.234772,587.987610 411.131378,596.869263 C412.935547,597.817627 415.039642,599.843628 417.033020,598.051270 C418.869568,596.399902 417.484741,594.008606 416.992737,591.941956 C412.771698,574.210449 410.178009,556.337219 412.513611,537.146179 z"
    //     fill="currentColor"
    //   />
    // </svg>

    <Link aria-label="Motiq home" className="group inline-flex" to="/">
      <div className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-black transition-colors group-hover:border-white/20">
        <svg
          className="h-6 w-6 text-white transition-colors group-hover:text-zinc-300"
          viewBox="250 250 524 524"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Motiq</title>
          <path
            d="M469.123596,676.897461 C463.831482,671.561035 458.676392,666.576782 453.829468,661.309021 C451.538391,658.819092 449.111969,658.065735 445.864014,658.431396 C390.924194,664.615051 340.442688,629.341919 328.184509,575.925781 C320.170563,541.004211 327.274261,508.608612 345.514099,478.226807 C354.174561,463.801239 364.851837,451.129120 377.741516,440.354034 C380.792267,437.803741 381.045959,435.062866 380.196869,431.482147 C374.982819,409.493530 375.983307,387.842499 384.839661,366.915009 C399.471680,332.339569 424.925201,309.878418 461.725098,301.964539 C495.674622,294.663635 527.078857,302.890167 556.070557,321.275238 C568.392334,329.089081 579.290894,338.581696 588.654114,349.786163 C590.551819,352.057068 592.676941,352.856598 595.644409,352.529083 C655.779724,345.891449 707.586304,386.355286 715.093018,446.196136 C719.637390,482.421387 708.299133,514.500366 687.908691,543.905579 C681.133789,553.675659 673.094910,562.335083 663.954163,569.938293 C661.306824,572.140320 660.183228,574.245728 661.047607,578.052612 C667.259277,605.410156 664.252625,631.719238 650.536377,656.366577 C632.382019,688.988953 604.377808,707.135193 567.410522,711.367004 C536.981018,714.850464 509.973206,705.322449 484.878876,688.933044 C479.425964,685.371704 474.306854,681.386963 469.123596,676.897461 M481.487946,504.907715 C480.597900,508.072571 477.748474,511.110138 481.398743,514.442139 C493.026550,525.056152 505.708038,534.078491 520.071777,540.648743 C524.061218,542.473633 527.289673,542.051880 530.189636,538.414551 C539.903442,526.231079 547.883240,513.070679 553.666077,498.568695 C555.101868,494.968079 554.666260,492.269165 551.690552,489.715057 C539.281799,479.064392 525.404968,471.134155 509.725189,466.335114 C506.300110,465.286804 504.219727,466.296906 502.024841,468.891327 C493.104156,479.435547 486.372955,491.189667 481.487946,504.907715 M517.183411,405.064514 C528.658875,408.640350 539.810669,412.944855 550.009827,419.447113 C551.211670,420.213318 552.668030,421.403473 554.089905,420.118744 C555.421082,418.915955 554.777893,417.276276 554.105896,415.947693 C551.702820,411.196381 549.451599,406.342712 546.693054,401.800995 C531.069519,376.078369 508.944336,362.076721 478.038544,364.288025 C458.316986,365.699127 440.177185,380.287292 434.859528,399.074738 C434.221619,401.328552 432.398743,404.053253 434.521027,406.098175 C436.422394,407.930176 438.976105,406.307922 441.145966,405.681824 C466.159424,398.464172 491.228790,397.279297 517.183411,405.064514 M558.288330,645.686462 C576.848083,645.274536 599.549500,632.022461 605.585999,611.617859 C606.195679,609.557129 607.617859,607.400696 606.069641,605.466187 C604.270752,603.218506 601.822998,604.516846 599.591614,605.093811 C579.549316,610.275818 559.318176,611.945862 538.803284,608.336426 C521.401611,605.274780 505.189636,599.033875 489.922241,590.207092 C488.435303,589.347351 486.742737,587.463562 484.997864,588.937622 C483.069275,590.566895 484.631287,592.632629 485.350555,594.425598 C487.405823,599.548523 490.102112,604.366150 493.198364,608.892273 C508.638489,631.462830 528.793274,645.943787 558.288330,645.686462 M644.003479,508.506287 C648.803711,501.238922 652.372559,493.390594 655.091614,485.132812 C660.868408,467.589081 660.403137,450.440308 651.676697,433.898407 C646.624695,424.321625 639.225037,417.107666 629.200867,412.785706 C625.466553,411.175690 623.872192,412.392731 624.230591,416.460480 C624.317078,417.443024 624.655090,418.402679 624.867798,419.374939 C629.625183,441.121826 632.019714,462.934082 627.354919,485.064301 C623.863953,501.625610 617.879028,517.227905 610.098755,532.201477 C609.023010,534.271790 607.086792,536.337708 609.336914,539.398682 C624.067749,532.892639 634.407349,521.656555 644.003479,508.506287 M412.513611,537.146179 C412.729675,534.663208 412.777191,532.151978 413.188934,529.701904 C416.022095,512.842957 421.171936,496.756348 429.334381,481.678070 C430.307526,479.880371 431.905609,478.081757 430.343597,475.394287 C425.345459,476.061676 421.745392,479.346558 418.061127,482.265686 C394.643250,500.820007 380.356689,524.069885 383.456451,554.951660 C385.299072,573.309448 394.234772,587.987610 411.131378,596.869263 C412.935547,597.817627 415.039642,599.843628 417.033020,598.051270 C418.869568,596.399902 417.484741,594.008606 416.992737,591.941956 C412.771698,574.210449 410.178009,556.337219 412.513611,537.146179 z"
            fill="currentColor"
          />
        </svg>
      </div>
    </Link>
  )
}

interface AppSidebarProps {
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  organization?: {
    id: string
    name: string
    slug: string
    logo?: string | null
  } | null
}

export function AppSidebar({
  mobileOpen = false,
  onMobileOpenChange,
  organization,
}: AppSidebarProps) {
  const location = useLocation()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const organizationLogoUrl = getMediaUrl(organization?.logo)
  const workspaces = useQuery(trpc.workspace.list.queryOptions())
  const alertCount = useQuery(trpc.alert.getUnacknowledgedCount.queryOptions())
  const signalCount = useQuery(trpc.signal.getActionableCount.queryOptions())
  const pendingActions = useQuery(
    trpc.autonomy.getActionQueue.queryOptions({ limit: 100 })
  )
  const leaveWorkspace = useMutation(
    trpc.workspace.leaveActive.mutationOptions({
      onError: (error) => {
        toast.error(error.message ?? "Failed to leave workspace")
        setLeaving(false)
      },
    })
  )
  const [expanded, setExpanded] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>(null)
  const previousPathname = useRef(location.pathname)
  const showExpanded = expanded || mobileOpen

  const activeWorkspace = workspaces.data?.find(
    (ws) => ws.id === organization?.id
  )
  const canLeaveActiveWorkspace =
    activeWorkspace?.role
      ?.split(",")
      .map((role) => role.trim())
      .some((role) => role === "member" || role === "admin") ?? false

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse`,
      {
        withCredentials: true,
      }
    )

    const invalidateSignals = () => {
      if (location.pathname.startsWith("/signals")) {
        return
      }

      queryClient.invalidateQueries({
        queryKey: trpc.signal.getActionableCount.queryKey(),
      })
    }

    const invalidateAlerts = () => {
      queryClient.invalidateQueries({
        queryKey: trpc.alert.getUnacknowledgedCount.queryKey(),
      })
    }

    const invalidateActions = () => {
      if (location.pathname.startsWith("/autonomy")) {
        return
      }

      queryClient.invalidateQueries({
        queryKey: trpc.autonomy.getActionQueue.queryKey(),
      })
    }

    eventSource.addEventListener("signal:created", invalidateSignals)
    eventSource.addEventListener("signal:updated", invalidateSignals)
    eventSource.addEventListener("alert:created", invalidateAlerts)
    eventSource.addEventListener("alert:updated", invalidateAlerts)
    eventSource.addEventListener("action:proposed", invalidateActions)

    return () => eventSource.close()
  }, [location.pathname, queryClient, trpc])

  useEffect(() => {
    if (previousPathname.current !== location.pathname) {
      previousPathname.current = location.pathname
      onMobileOpenChange?.(false)
    }
  }, [location.pathname, onMobileOpenChange])

  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileOpenChange?.(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mobileOpen, onMobileOpenChange])

  function isActive(href: string) {
    if (href === "/overview" && location.pathname !== "/overview") {
      return false
    }
    return location.pathname.startsWith(href)
  }

  async function handleSwitchWorkspace(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId })
    window.location.reload()
  }

  async function handleLeaveWorkspace() {
    if (!(organization && canLeaveActiveWorkspace)) {
      return
    }

    setLeaving(true)

    try {
      await leaveWorkspace.mutateAsync()
    } catch {
      return
    }

    const nextWorkspace = workspaces.data?.find(
      (ws) => ws.id !== organization.id
    )

    if (nextWorkspace) {
      await authClient.organization.setActive({
        organizationId: nextWorkspace.id,
      })
      window.location.reload()
      return
    }

    window.location.href = "/onboarding"
  }

  const handleMouseEnter = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
    setExpanded(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    closeTimeout.current = setTimeout(() => {
      setExpanded(false)
    }, 200)
  }, [])

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: hover-to-expand sidebar is a presentational affordance
    <aside
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-white/[0.06] border-r bg-[oklch(0.1_0_0)] transition-[transform,width] duration-200 ease-in-out max-[769px]:shadow-2xl ${
        mobileOpen
          ? "max-[769px]:visible max-[769px]:translate-x-0"
          : "max-[769px]:pointer-events-none max-[769px]:invisible max-[769px]:-translate-x-full"
      } ${expanded ? "min-[769px]:w-60" : "min-[769px]:w-[4.5rem]"}`}
      id="app-navigation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header — logo */}
      <div className="flex h-16 shrink-0 items-center border-white/[0.06] border-b pl-5">
        {/*<Link
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black"
          to="/overview"
        >
        </Link>*/}
        <MotiqLogo />
        <Button
          aria-label="Close navigation"
          className="mr-3 ml-auto size-9 rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white min-[769px]:hidden"
          onClick={() => onMobileOpenChange?.(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XMarkIcon className="size-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const unread = getNavUnreadCount(item.label, {
              alerts: alertCount.data?.count ?? 0,
              autonomy: pendingActions.data?.length ?? 0,
              signals: signalCount.data?.count ?? 0,
            })

            const linkContent = (
              <Link
                className={`mx-4 flex h-10 items-center gap-3 rounded-md px-2.5 transition-colors ${
                  active
                    ? "bg-white/[0.08] font-medium text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
                onClick={() => onMobileOpenChange?.(false)}
                to={item.href}
              >
                <item.icon
                  className={`size-5 shrink-0 ${active ? "text-white" : "text-zinc-500"}`}
                />
                {showExpanded && (
                  <span className="whitespace-nowrap text-[15px]">
                    {item.label}
                  </span>
                )}
                {showExpanded && unread > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/15 px-1.5 font-medium text-[11px] text-red-400 ring-1 ring-red-500/20">
                    {unread}
                  </span>
                )}
                {!showExpanded && unread > 0 && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                )}
              </Link>
            )

            return (
              <li className="relative" key={item.href}>
                {showExpanded ? (
                  linkContent
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer — workspace selector */}
      <div className="shrink-0 border-white/[0.06] border-t p-2 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-md px-2 transition-colors hover:bg-white/[0.04]"
              type="button"
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06] font-semibold text-sm text-zinc-300">
                {(() => {
                  if (organization && organizationLogoUrl) {
                    return (
                      <img
                        alt={organization.name}
                        className="size-full object-cover"
                        height={40}
                        src={organizationLogoUrl}
                        width={40}
                      />
                    )
                  }
                  return organization?.name
                    ? organization.name.charAt(0).toUpperCase()
                    : "M"
                })()}
              </div>
              {showExpanded && (
                <span className="truncate font-medium text-[15px] text-zinc-300">
                  {organization?.name ?? "Motiq"}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="glass-high w-56"
            side="top"
          >
            <div className="px-2 py-1.5 font-medium text-[11px] text-zinc-500 uppercase tracking-wider">
              Workspaces
            </div>
            {workspaces.data?.map((ws) => {
              const isActive = ws.id === organization?.id
              const workspaceLogoUrl = getMediaUrl(ws.logo)
              return (
                <DropdownMenuItem
                  className={`gap-2.5 px-2 py-2 text-zinc-200 focus:bg-white/10 focus:text-white ${
                    isActive ? "cursor-default" : "cursor-pointer"
                  }`}
                  key={ws.id}
                  onClick={
                    isActive ? undefined : () => handleSwitchWorkspace(ws.id)
                  }
                >
                  <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.04] font-medium text-[10px] text-zinc-400">
                    {workspaceLogoUrl ? (
                      <img
                        alt={ws.name}
                        className="size-full object-cover"
                        height={24}
                        src={workspaceLogoUrl}
                        width={24}
                      />
                    ) : (
                      ws.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="flex-1 truncate text-sm">{ws.name}</span>
                  {isActive && (
                    <div className="size-1.5 rounded-full bg-white" />
                  )}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              className="cursor-pointer gap-2.5 px-2 py-2 text-zinc-400 focus:bg-white/10 focus:text-white"
              onSelect={(e) => {
                e.preventDefault()
                setCreateOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              <span className="text-sm">Create workspace</span>
            </DropdownMenuItem>
            {canLeaveActiveWorkspace && organization ? (
              <>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 px-2 py-2 text-red-400 focus:bg-red-500/10 focus:text-red-300"
                  onSelect={(e) => {
                    e.preventDefault()
                    setLeaveOpen(true)
                  }}
                >
                  <ArrowRightStartOnRectangleIcon className="size-4" />
                  <span className="text-sm">Leave workspace</span>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CreateWorkspaceDialog onOpenChange={setCreateOpen} open={createOpen} />
      <Dialog
        onOpenChange={(next) => {
          if (!leaving) {
            setLeaveOpen(next)
          }
        }}
        open={leaveOpen}
      >
        <DialogContent className="rounded-xl border border-white/[0.08] bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medium text-lg text-white tracking-tight">
              Leave workspace?
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              You will lose access to {organization?.name ?? "this workspace"}.
              An owner or admin can invite you back later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="cursor-pointer rounded-sm font-medium text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={leaving}
              onClick={() => setLeaveOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer rounded-sm border border-red-500/20 bg-red-500/10 font-medium text-red-300 text-sm transition-all hover:bg-red-500/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={leaving}
              onClick={handleLeaveWorkspace}
              type="button"
              variant="outline"
            >
              {leaving ? "Leaving..." : "Leave workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}

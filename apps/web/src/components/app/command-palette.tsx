import {
  BellIcon,
  LinkIcon,
  PuzzlePieceIcon,
  SignalIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@motiq/ui/components/command"
import { useNavigate } from "@tanstack/react-router"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const navItems = [
  {
    label: "Go to Overview",
    href: "/overview",
    icon: Squares2X2Icon,
    shortcut: "G D",
  },
  {
    label: "Go to Signals",
    href: "/signals",
    icon: SignalIcon,
    shortcut: "G S",
  },
  {
    label: "Go to Apps",
    href: "/apps",
    icon: PuzzlePieceIcon,
    shortcut: "G I",
  },
  {
    label: "Go to Pipelines",
    href: "/pipelines",
    icon: LinkIcon,
    shortcut: "G P",
  },
  {
    label: "Go to Alerts",
    href: "/alerts",
    icon: BellIcon,
    shortcut: "G A",
  },
  {
    label: "Go to Chat",
    href: "/chat",
    icon: SparklesIcon,
    shortcut: "G C",
  },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()

  function handleSelect(href: string) {
    onOpenChange(false)
    navigate({ to: href })
  }

  return (
    <CommandDialog
      className="rounded-xl border border-white/[0.08] bg-zinc-950/95 shadow-2xl backdrop-blur-2xl"
      onOpenChange={onOpenChange}
      open={open}
    >
      <CommandInput
        className="text-sm text-zinc-100 placeholder:text-zinc-500 focus:ring-0"
        placeholder="Search..."
      />
      <CommandList className="border-white/5 border-t">
        <CommandEmpty className="p-6 text-center text-sm text-zinc-500">
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              className="group flex cursor-pointer items-center gap-3 px-4 py-3 data-[selected=true]:bg-zinc-900 data-[selected=true]:text-white"
              key={item.href}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="size-4 text-zinc-500 group-data-[selected=true]:text-white" />
              <span className="font-medium text-sm">{item.label}</span>
              <span className="ml-auto text-[10px] text-zinc-600 group-data-[selected=true]:text-white/50">
                [{item.shortcut}]
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

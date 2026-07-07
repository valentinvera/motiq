import {
  PromptInput,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputController,
} from "@motiq/ui/components/ai-elements/prompt-input"
import { cn } from "@motiq/ui/lib/utils"
import type { ChatStatus } from "ai"
import {
  ArrowUpIcon,
  AtSignIcon,
  BellIcon,
  BotIcon,
  RadioIcon,
  SlackIcon,
  ZapIcon,
} from "lucide-react"
import type { ComponentType, KeyboardEvent, ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

interface ChatComposerProps {
  className?: string
  footer?: ReactNode
  onStop?: () => void
  onSubmit: (message: PromptInputMessage) => void | Promise<void>
  placeholder?: string
  status?: ChatStatus
}

type ComposerMenuType = "command" | "mention"

interface ComposerSuggestion {
  description: string
  icon: ComponentType<{ className?: string }>
  label: string
  prompt: string
  trigger: string
}

const COMMAND_SUGGESTIONS: ComposerSuggestion[] = [
  {
    description: "Check Slack connection health, channel, and latest activity.",
    icon: SlackIcon,
    label: "Status",
    prompt: "/slack status Show Slack connection status and latest activity.",
    trigger: "/slack status",
  },
  {
    description: "Summarize recent feedback received from Slack.",
    icon: RadioIcon,
    label: "Signals",
    prompt:
      "/slack signals Summarize recent Slack signals and call out anything urgent.",
    trigger: "/slack signals",
  },
  {
    description: "Review Slack-sourced alerts that need attention.",
    icon: BellIcon,
    label: "Alerts",
    prompt:
      "/slack alerts Show open alerts from Slack and recommend what should be escalated.",
    trigger: "/slack alerts",
  },
  {
    description: "Post an explicit alert escalation to Slack.",
    icon: ZapIcon,
    label: "Escalate",
    prompt: "/slack escalate Escalate the most urgent open alert to Slack.",
    trigger: "/slack escalate",
  },
]

const MENTION_SUGGESTIONS: ComposerSuggestion[] = [
  {
    description: "Use Slack feedback and channel activity as context.",
    icon: SlackIcon,
    label: "Signals",
    prompt: "@slack signals ",
    trigger: "@slack signals",
  },
  {
    description: "Use Slack-sourced alerts as context.",
    icon: BellIcon,
    label: "Alerts",
    prompt: "@slack alerts ",
    trigger: "@slack alerts",
  },
  {
    description: "Use all recent signals as the context for your question.",
    icon: RadioIcon,
    label: "Motiq",
    prompt: "@signals ",
    trigger: "@signals",
  },
  {
    description: "Use all open alerts as the context for your question.",
    icon: BellIcon,
    label: "Motiq",
    prompt: "@alerts ",
    trigger: "@alerts",
  },
  {
    description: "Ask about pending agent actions and autonomy rules.",
    icon: BotIcon,
    label: "Motiq",
    prompt: "@autonomy ",
    trigger: "@autonomy",
  },
]

const TYPED_TRIGGER_PATTERN = /(?:^|\s)([@/])([\w-]*)$/

const TOOL_ACTIONS: {
  icon: ComponentType<{ className?: string }>
  label: string
  menuType: ComposerMenuType
}[] = [{ icon: AtSignIcon, label: "Mention", menuType: "mention" }]

export function ChatComposer({
  className,
  footer,
  onStop,
  onSubmit,
  placeholder = "How can I help you today?",
  status = "ready",
}: ChatComposerProps) {
  return (
    <PromptInputProvider>
      <ChatComposerInner
        className={className}
        footer={footer}
        onStop={onStop}
        onSubmit={onSubmit}
        placeholder={placeholder}
        status={status}
      />
    </PromptInputProvider>
  )
}

function ChatComposerInner({
  className,
  footer,
  onStop,
  onSubmit,
  placeholder,
  status,
}: Required<Pick<ChatComposerProps, "onSubmit" | "placeholder" | "status">> &
  Pick<ChatComposerProps, "className" | "footer" | "onStop">) {
  const controller = usePromptInputController()
  const [forcedMenuType, setForcedMenuType] = useState<ComposerMenuType | null>(
    null
  )
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [dismissedMenuValue, setDismissedMenuValue] = useState<string | null>(
    null
  )
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const inputValue = controller.textInput.value
  const typedTrigger = getTypedTrigger(inputValue)
  const menuType = forcedMenuType ?? typedTrigger?.type ?? null
  const query = forcedMenuType ? "" : (typedTrigger?.query ?? "")
  const suggestions = useMemo(() => {
    const base =
      menuType === "mention" ? MENTION_SUGGESTIONS : COMMAND_SUGGESTIONS
    if (!query) {
      return base
    }
    const normalizedQuery = query.toLowerCase()
    return base.filter((suggestion) =>
      [suggestion.trigger, suggestion.label, suggestion.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [menuType, query])
  const showSuggestions =
    menuType !== null &&
    suggestions.length > 0 &&
    dismissedMenuValue !== inputValue

  useEffect(() => {
    if (dismissedMenuValue !== null && dismissedMenuValue !== inputValue) {
      setDismissedMenuValue(null)
    }
  }, [dismissedMenuValue, inputValue])

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset keyboard selection whenever the visible suggestion set changes
  useEffect(() => {
    setActiveSuggestionIndex(0)
  }, [menuType, query, suggestions.length])

  useEffect(() => {
    if (!showSuggestions) {
      return
    }

    suggestionRefs.current[activeSuggestionIndex]?.scrollIntoView({
      block: "nearest",
    })
  }, [activeSuggestionIndex, showSuggestions])

  const handleSelectSuggestion = (suggestion: ComposerSuggestion) => {
    const value = controller.textInput.value
    let nextValue = suggestion.prompt

    if (typedTrigger && !forcedMenuType) {
      nextValue = `${value.slice(0, typedTrigger.start)}${suggestion.prompt}`
    } else if (value.trim()) {
      nextValue = `${value.trimEnd()} ${suggestion.prompt}`
    }

    controller.textInput.setInput(nextValue)
    setForcedMenuType(null)
    setDismissedMenuValue(null)
  }

  const closeSuggestions = () => {
    setForcedMenuType(null)
    setDismissedMenuValue(inputValue)
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) {
      if (event.key === "Escape") {
        closeSuggestions()
      }
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveSuggestionIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length
      )
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const activeSuggestion = suggestions[activeSuggestionIndex]
      if (activeSuggestion) {
        handleSelectSuggestion(activeSuggestion)
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      closeSuggestions()
    }
  }

  const handleToolAction = (menuType: ComposerMenuType) => {
    setDismissedMenuValue(null)
    setForcedMenuType((current) => (current === menuType ? null : menuType))
  }

  return (
    <div className={cn("w-full max-w-[640px]", className)}>
      <div className="relative">
        {showSuggestions ? (
          <div className="absolute top-full left-0 z-20 mt-2 w-full max-w-[520px] overflow-hidden rounded-lg border border-white/[0.08] bg-[#070707] shadow-2xl shadow-black/40">
            <div className="border-white/[0.06] border-b px-3 py-2 font-medium text-[10px] text-zinc-500 uppercase tracking-[0.14em]">
              {menuType === "mention"
                ? "Context namespaces"
                : "Command namespaces"}
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {suggestions.map((suggestion, index) => (
                <button
                  aria-selected={index === activeSuggestionIndex}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05]",
                    index === activeSuggestionIndex && "bg-white/[0.06]"
                  )}
                  key={suggestion.trigger}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  ref={(element) => {
                    suggestionRefs.current[index] = element
                  }}
                  role="option"
                  type="button"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                    <suggestion.icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-sm text-zinc-200">
                        {suggestion.trigger}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {suggestion.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 leading-5">
                      {suggestion.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <PromptInput
          className="[&_[data-slot=input-group]]:rounded-xl [&_[data-slot=input-group]]:border-white/[0.06] [&_[data-slot=input-group]]:bg-white/[0.015] [&_[data-slot=input-group]]:p-3 [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:transition-colors [&_[data-slot=input-group]]:hover:border-white/[0.1] [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:border-white/[0.12] [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          onSubmit={(message) => {
            setForcedMenuType(null)
            return onSubmit(message)
          }}
        >
          <PromptInputTextarea
            className="max-h-40 min-h-0 px-2 pt-1 pb-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0"
            onKeyDown={handleMenuKeyDown}
            placeholder={placeholder}
          />
          <PromptInputFooter className="p-0">
            <div className="flex items-center gap-1">
              {TOOL_ACTIONS.map((action) => (
                <ChatComposerIconButton
                  active={forcedMenuType === action.menuType}
                  icon={action.icon}
                  key={action.label}
                  label={action.label}
                  onClick={() => handleToolAction(action.menuType)}
                />
              ))}
            </div>
            <ChatComposerSubmit onStop={onStop} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
      {footer}
    </div>
  )
}

function getTypedTrigger(value: string) {
  const match = TYPED_TRIGGER_PATTERN.exec(value)
  const trigger = match?.[1]
  if (!(match && (trigger === "@" || trigger === "/"))) {
    return null
  }

  const query = match[2] ?? ""
  return {
    query,
    start: match.index + match[0].length - trigger.length - query.length,
    type: trigger === "@" ? ("mention" as const) : ("command" as const),
  }
}

function ChatComposerIconButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean
  icon: ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200",
        active && "bg-white/[0.06] text-zinc-200"
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-3.5" />
    </button>
  )
}

function ChatComposerSubmit({
  onStop,
  status,
}: {
  onStop?: () => void
  status: ChatStatus
}) {
  const controller = usePromptInputController()
  const isGenerating = status === "submitted" || status === "streaming"
  const hasText = controller.textInput.value.trim().length > 0
  const canSubmit = isGenerating || hasText

  return (
    <PromptInputSubmit
      className={cn(
        "flex size-7 items-center justify-center rounded-md bg-white/[0.06] text-zinc-300 transition-colors hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
        canSubmit && "cursor-pointer"
      )}
      disabled={!canSubmit}
      onStop={onStop}
      size="icon-sm"
      status={status}
      variant="ghost"
    >
      {isGenerating ? undefined : <ArrowUpIcon className="size-4" />}
    </PromptInputSubmit>
  )
}

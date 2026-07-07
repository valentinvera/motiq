import { useChat } from "@ai-sdk/react"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@motiq/ui/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@motiq/ui/components/ai-elements/message"
import {
  Suggestion,
  Suggestions,
} from "@motiq/ui/components/ai-elements/suggestion"
import { useQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { DefaultChatTransport } from "ai"
import { ClockIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { ChatComposer } from "@/components/app/chat-composer"
import { type ChatListItem, createChat, listChats } from "@/lib/chat"

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [{ title: "Chat | Motiq" }],
  }),
  component: ChatPage,
})

const suggestions = [
  "What are the top churn signals this week?",
  "Summarize unacknowledged alerts",
  "Which customers need attention?",
]

const TRAILING_SLASHES_REGEX = /\/+$/

function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCreating, setIsCreating] = useState(false)
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_API_URL}/api/chat`,
        credentials: "include",
      }),
    []
  )

  const { messages, sendMessage, status, stop } = useChat({ transport })
  const chats = useQuery({
    queryKey: ["chats"],
    queryFn: listChats,
    staleTime: 15_000,
  })

  const startPersistedChat = useCallback(
    async (text: string) => {
      setIsCreating(true)
      try {
        const chat = await createChat(text)
        navigate({ to: "/chat/$id", params: { id: chat.id } })
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to start chat"
        )
        setIsCreating(false)
      }
    },
    [navigate]
  )

  const handleSubmit = useCallback(
    ({ text }: { text?: string }) => {
      const value = text?.trim()
      if (!value) {
        return
      }
      if (messages.length === 0) {
        startPersistedChat(value)
        return
      }
      sendMessage({ text: value })
    },
    [messages.length, sendMessage, startPersistedChat]
  )

  const handleSuggestion = useCallback(
    (text: string) => {
      if (messages.length === 0) {
        startPersistedChat(text)
        return
      }
      sendMessage({ text })
    },
    [messages.length, sendMessage, startPersistedChat]
  )

  const normalizedPathname =
    location.pathname.replace(TRAILING_SLASHES_REGEX, "") || "/"
  if (normalizedPathname !== "/chat") {
    return <Outlet />
  }

  return (
    <div className="-m-6 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden md:-m-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black via-black/90 to-transparent" />

      {messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-24 md:px-10">
          <div className="flex w-full max-w-[680px] flex-col items-center">
            <h1 className="mb-2 font-semibold text-2xl text-zinc-100">
              Ask Motiq
            </h1>
            <p className="mb-5 text-center text-sm text-zinc-500">
              Ask about signals, alerts, trends, or customer health.
            </p>
            <div className="mb-4 w-full max-w-[640px] overflow-hidden">
              <Suggestions className="justify-start">
                {suggestions.map((s) => (
                  <Suggestion
                    className="rounded-lg border-white/[0.08] bg-white/[0.025] text-xs text-zinc-500 hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-zinc-200"
                    key={s}
                    onClick={handleSuggestion}
                    suggestion={s}
                    variant="outline"
                  />
                ))}
              </Suggestions>
            </div>
            <ChatComposer
              className="mx-auto"
              onStop={stop}
              onSubmit={handleSubmit}
              placeholder="Reply..."
              status={isCreating ? "submitted" : status}
            />
            <RecentChats
              chats={chats.data?.items ?? []}
              isLoading={chats.isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-6 right-6 left-6 z-30 text-center md:top-8 md:right-10 md:left-10">
            <h1 className="font-medium text-sm text-zinc-100">Ask Motiq</h1>
          </div>
          <Conversation className="min-h-0 flex-1 [scrollbar-color:rgba(113,113,122,0.34)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.18] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-6 pt-28 pb-64 md:px-0 md:pt-32">
              {messages.map((message) => (
                <Message
                  className={
                    message.role === "user"
                      ? "max-w-[72%] md:max-w-[48%]"
                      : "max-w-full"
                  }
                  from={message.role}
                  key={message.id}
                >
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "rounded-xl border border-white/[0.10] bg-white/[0.045] px-4 py-2.5 text-sm text-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                        : "w-full bg-transparent px-0 py-0 text-[15px] text-zinc-300 leading-7"
                    }
                  >
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <MessageResponse
                            className={
                              message.role === "user"
                                ? "text-inherit [&_*]:my-0 [&_*]:text-inherit"
                                : "text-inherit [&_*]:text-inherit [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-medium [&_h2]:text-xl [&_h2]:text-zinc-100 [&_p]:my-3 [&_strong]:font-medium [&_strong]:text-zinc-100"
                            }
                            key={`${message.id}-${i}`}
                          >
                            {part.text}
                          </MessageResponse>
                        )
                      }
                      return null
                    })}
                  </MessageContent>
                </Message>
              ))}

              {(status === "streaming" || status === "submitted") &&
                messages.at(-1)?.role !== "assistant" && (
                  <div className="flex justify-start pt-1">
                    <span className="inline-block h-4 w-1 animate-pulse bg-zinc-300" />
                  </div>
                )}
            </ConversationContent>
            <ConversationScrollButton className="bottom-44 z-50 size-9 cursor-pointer rounded-full border border-white/[0.16] bg-[#171717] text-zinc-100 shadow-[0_12px_32px_rgba(0,0,0,0.55)] hover:border-white/[0.24] hover:bg-[#1f1f1f] hover:text-white dark:bg-[#171717] dark:hover:bg-[#1f1f1f] [&_svg]:size-4" />
          </Conversation>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-56 bg-gradient-to-t from-35% from-black via-75% via-black/95 to-transparent" />
          <div className="absolute right-6 bottom-8 left-6 z-40 md:right-10 md:left-10">
            <ChatComposer
              className="mx-auto"
              onStop={stop}
              onSubmit={handleSubmit}
              placeholder="Reply..."
              status={isCreating ? "submitted" : status}
            />
          </div>
        </>
      )}
    </div>
  )
}

function RecentChats({
  chats,
  isLoading,
}: {
  chats: ChatListItem[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="mt-6 w-full max-w-2xl space-y-2">
        <div className="h-3 w-20 rounded-full bg-white/[0.05]" />
        <div className="h-12 rounded-xl border border-white/[0.06] bg-white/[0.02]" />
      </div>
    )
  }

  if (chats.length === 0) {
    return null
  }

  return (
    <div className="mt-6 w-full max-w-2xl">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="font-medium text-[11px] text-zinc-500 uppercase tracking-[0.12em]">
          Recent chats
        </p>
        <span className="text-[11px] text-zinc-700">{chats.length}</span>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.02] [scrollbar-color:rgba(113,113,122,0.35)_transparent] [scrollbar-width:thin]">
        {chats.map((chat) => (
          <Link
            className="group flex cursor-pointer items-center justify-between gap-4 border-white/[0.06] px-4 py-3 text-left transition-colors hover:bg-white/[0.035] [&:not(:last-child)]:border-b"
            key={chat.id}
            params={{ id: chat.id }}
            to="/chat/$id"
          >
            <span className="min-w-0 truncate text-sm text-zinc-300 transition-colors group-hover:text-zinc-100">
              {chat.title}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-zinc-700">
              <ClockIcon className="size-3" />
              {formatChatDate(chat.updatedAt)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function formatChatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date)
}

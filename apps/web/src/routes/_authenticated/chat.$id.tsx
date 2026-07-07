import { useChat } from "@ai-sdk/react"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@motiq/ui/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@motiq/ui/components/ai-elements/message"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { DefaultChatTransport, type UIMessage } from "ai"
import { ArrowLeftIcon, SparklesIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { ChatComposer } from "@/components/app/chat-composer"

export const Route = createFileRoute("/_authenticated/chat/$id")({
  head: () => ({
    meta: [{ title: "Chat | Motiq" }],
  }),
  component: ChatThreadPage,
})

interface StoredChat {
  id: string
  title: string
  messages: UIMessage[]
}

function ChatThreadPage() {
  const { id } = Route.useParams()
  const chat = useQuery({
    queryKey: ["chat", id],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat/${id}`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error((await response.text()) || "Failed to load chat")
      }

      return (await response.json()) as StoredChat
    },
  })

  if (chat.isLoading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center">
        <span className="inline-block h-4 w-1 animate-pulse bg-white" />
      </div>
    )
  }

  if (!chat.data) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center text-sm text-zinc-500">
        Chat not found.
      </div>
    )
  }

  return (
    <ChatSurface
      autoSubmitInitial={chat.data.messages.length === 1}
      chatId={id}
      initialMessages={chat.data.messages}
      title={chat.data.title}
    />
  )
}

function ChatSurface({
  chatId,
  initialMessages,
  title,
  autoSubmitInitial = false,
}: {
  chatId: string
  initialMessages: UIMessage[]
  title: string
  autoSubmitInitial?: boolean
}) {
  const submittedInitial = useRef(false)
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_API_URL}/api/chat/${chatId}`,
        credentials: "include",
      }),
    [chatId]
  )

  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  })

  useEffect(() => {
    if (
      autoSubmitInitial &&
      !submittedInitial.current &&
      status === "ready" &&
      messages.length === 1 &&
      messages[0]?.role === "user"
    ) {
      submittedInitial.current = true
      sendMessage()
    }
  }, [autoSubmitInitial, messages, sendMessage, status])

  const handleSubmit = useCallback(
    ({ text }: { text?: string }) => {
      const value = text?.trim()
      if (!value) {
        return
      }
      sendMessage({ text: value })
    },
    [sendMessage]
  )

  return (
    <div className="-m-6 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden md:-m-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black via-black/90 to-transparent" />

      <div className="absolute top-6 right-6 left-6 z-30 grid grid-cols-[2.5rem_1fr_2.5rem] items-center md:top-8 md:right-10 md:left-10">
        <Link
          aria-label="Back to chat"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-zinc-500 transition-colors hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-zinc-200"
          to="/chat"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div className="min-w-0 px-4 text-center">
          <h1 className="truncate font-medium text-sm text-zinc-100">
            {title}
          </h1>
        </div>
        <div />
      </div>

      <Conversation className="min-h-0 flex-1 [scrollbar-color:rgba(113,113,122,0.34)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.18]">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-6 pt-28 pb-52 md:px-0 md:pt-32">
          {messages.length === 0 ? (
            <ConversationEmptyState className="min-h-[52dvh]">
              <div className="flex flex-col items-center gap-5">
                <div className="flex size-11 items-center justify-center border border-white/[0.12] bg-white/[0.03]">
                  <SparklesIcon className="size-5 text-zinc-200" />
                </div>
                <p className="max-w-sm text-center text-sm text-zinc-500">
                  Ask about signals, alerts, trends, or customer health.
                </p>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
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
            ))
          )}

          {(status === "streaming" || status === "submitted") &&
            messages.at(-1)?.role !== "assistant" && (
              <div className="flex justify-start pt-1">
                <span className="inline-block h-4 w-1 animate-pulse bg-zinc-300" />
              </div>
            )}
        </ConversationContent>
        <ConversationScrollButton className="bottom-44 z-50 size-9 cursor-pointer rounded-full border border-white/[0.16] bg-[#171717] text-zinc-100 shadow-[0_12px_32px_rgba(0,0,0,0.55)] hover:border-white/[0.24] hover:bg-[#1f1f1f] hover:text-white dark:bg-[#171717] dark:hover:bg-[#1f1f1f] [&_svg]:size-4" />
      </Conversation>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-56 bg-gradient-to-t from-black from-35% via-black/95 via-75% to-transparent" />
      <div className="absolute right-6 bottom-8 left-6 z-40 md:right-10 md:left-10">
        <ChatComposer
          className="mx-auto"
          onStop={stop}
          onSubmit={handleSubmit}
          placeholder="Reply..."
          status={status}
        />
        <p className="mt-3 text-center text-[11px] text-zinc-700">
          Motiq AI can make mistakes. Verify critical customer actions.
        </p>
      </div>
    </div>
  )
}

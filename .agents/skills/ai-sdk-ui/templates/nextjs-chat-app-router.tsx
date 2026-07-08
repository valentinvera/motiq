/**
 * Next.js App Router - Complete Chat Example
 *
 * Complete production-ready chat interface for Next.js App Router.
 *
 * Features:
 * - v5 useChat with manual input management
 * - Auto-scroll to bottom
 * - Loading states & error handling
 * - Stop generation button
 * - Responsive design
 * - Keyboard shortcuts (Enter to send, Cmd+K to clear)
 *
 * Directory structure:
 * app/
 * ├── chat/
 * │   └── page.tsx (this file)
 * └── api/
 *     └── chat/
 *         └── route.ts (see nextjs-api-route.ts)
 *
 * Usage:
 * 1. Copy to app/chat/page.tsx
 * 2. Create API route (see nextjs-api-route.ts)
 * 3. Navigate to /chat
 */

"use client"

import { useChat } from "ai/react"
import { type FormEvent, useEffect, useRef, useState } from "react"

export default function ChatPage() {
  const { messages, sendMessage, isLoading, error, stop, reload } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage({ content: input })
    setInput("")
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+K or Ctrl+K to clear (focus input)
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()
      inputRef.current?.focus()
    }
  }

  return (
    <div
      className="mx-auto flex h-screen max-w-4xl flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-4">
        <div>
          <h1 className="font-bold text-2xl">AI Assistant</h1>
          <p className="text-gray-600 text-sm">
            {messages.length > 0
              ? `${messages.length} message${messages.length === 1 ? "" : "s"}`
              : "Start a conversation"}
          </p>
        </div>
        {messages.length > 0 && !isLoading && (
          <button
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={() => window.location.reload()}
          >
            New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {messages.length === 0 ? (
          // Empty state
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="text-4xl">💬</div>
              <div>
                <h2 className="font-semibold text-gray-900 text-xl">
                  Start a conversation
                </h2>
                <p className="mt-2 text-gray-600">
                  Ask me anything or try one of these:
                </p>
              </div>
              <div className="grid max-w-md gap-2">
                {[
                  "Explain quantum computing",
                  "Write a haiku about coding",
                  "Plan a trip to Tokyo",
                ].map((suggestion, idx) => (
                  <button
                    className="rounded-lg border p-3 text-left transition-all hover:bg-white hover:shadow-sm"
                    key={idx}
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages list
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message, idx) => (
              <div
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
                key={message.id}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "border bg-white shadow-sm"
                  }`}
                >
                  {/* Role label (only for assistant on first message) */}
                  {message.role === "assistant" && idx === 1 && (
                    <div className="mb-2 font-semibold text-gray-500 text-xs">
                      AI Assistant
                    </div>
                  )}

                  {/* Message content */}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200" />
                    </div>
                    <span className="text-gray-600 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-red-200 border-t bg-red-50 p-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center space-x-2 text-red-700">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-semibold">Error</div>
                <div className="text-sm">{error.message}</div>
              </div>
            </div>
            <button
              className="rounded border border-red-300 px-3 py-1 text-sm hover:bg-red-100"
              onClick={reload}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form className="border-t bg-white p-4" onSubmit={handleSubmit}>
        <div className="mx-auto max-w-4xl">
          <div className="flex space-x-2">
            <input
              className="flex-1 rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              ref={inputRef}
              type="text"
              value={input}
            />
            {isLoading ? (
              <button
                className="rounded-lg bg-red-500 px-6 py-3 font-medium text-white hover:bg-red-600"
                onClick={stop}
                type="button"
              >
                Stop
              </button>
            ) : (
              <button
                className="rounded-lg bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                disabled={!input.trim()}
                type="submit"
              >
                Send
              </button>
            )}
          </div>
          <div className="mt-2 text-center text-gray-500 text-xs">
            Press Enter to send • Cmd+K to focus input
          </div>
        </div>
      </form>
    </div>
  )
}

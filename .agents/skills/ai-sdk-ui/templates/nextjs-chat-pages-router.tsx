/**
 * Next.js Pages Router - Complete Chat Example
 *
 * Complete production-ready chat interface for Next.js Pages Router.
 *
 * Features:
 * - v5 useChat with manual input management
 * - Auto-scroll to bottom
 * - Loading states & error handling
 * - Stop generation button
 * - Responsive design
 *
 * Directory structure:
 * pages/
 * ├── chat.tsx (this file)
 * └── api/
 *     └── chat.ts (see nextjs-api-route.ts)
 *
 * Usage:
 * 1. Copy to pages/chat.tsx
 * 2. Create API route at pages/api/chat.ts (see nextjs-api-route.ts)
 * 3. Navigate to /chat
 */

import { useChat } from "ai/react"
import Head from "next/head"
import { type FormEvent, useEffect, useRef, useState } from "react"

export default function ChatPage() {
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    api: "/api/chat",
  })

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage({ content: input })
    setInput("")
  }

  return (
    <>
      <Head>
        <title>AI Chat</title>
        <meta content="Chat with AI" name="description" />
      </Head>

      <div className="mx-auto flex h-screen max-w-3xl flex-col">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <h1 className="font-bold text-2xl">AI Chat</h1>
          <p className="text-gray-600 text-sm">
            Powered by AI SDK v5 (Pages Router)
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {messages.length === 0 ? (
            // Empty state
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mb-4 text-6xl">💬</div>
                <h2 className="font-semibold text-gray-700 text-xl">
                  Start a conversation
                </h2>
                <p className="mt-2 text-gray-500">
                  Type a message below to begin
                </p>
              </div>
            </div>
          ) : (
            // Messages list
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  key={message.id}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "border bg-white shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg border bg-white p-3 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="border-red-200 border-t bg-red-50 p-4">
            <div className="text-red-700">
              <strong>Error:</strong> {error.message}
            </div>
          </div>
        )}

        {/* Input */}
        <form className="border-t bg-white p-4" onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <input
              className="flex-1 rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              type="text"
              value={input}
            />
            {isLoading ? (
              <button
                className="rounded-lg bg-red-500 px-6 py-3 text-white hover:bg-red-600"
                onClick={stop}
                type="button"
              >
                Stop
              </button>
            ) : (
              <button
                className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                disabled={!input.trim()}
                type="submit"
              >
                Send
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  )
}

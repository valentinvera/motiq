/**
 * AI SDK UI - Basic Chat Component (v5)
 *
 * Demonstrates:
 * - useChat hook with v5 manual input management
 * - Streaming chat messages
 * - Loading states
 * - Error handling
 * - Auto-scroll to latest message
 *
 * CRITICAL v5 Change: useChat NO LONGER manages input state!
 * You must manually manage input with useState.
 *
 * Usage:
 * 1. Copy this component to your app
 * 2. Create API route (see nextjs-api-route.ts)
 * 3. Customize styling as needed
 */

"use client"

import { useChat } from "ai/react"
import { type FormEvent, useEffect, useRef, useState } from "react"

export default function ChatBasic() {
  // useChat hook - v5 style
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    api: "/api/chat",
  })

  // Manual input management (v5 requires this!)
  const [input, setInput] = useState("")

  // Auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // v5: Use sendMessage instead of append
    sendMessage({ content: input })
    setInput("")
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="font-bold text-2xl">AI Chat</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-200 p-3">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="border-red-200 border-t bg-red-50 p-4 text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Input */}
      <form className="border-t p-4" onSubmit={handleSubmit}>
        <div className="flex space-x-2">
          <input
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            value={input}
          />
          {isLoading ? (
            <button
              className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              onClick={stop}
              type="button"
            >
              Stop
            </button>
          ) : (
            <button
              className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={!input.trim()}
              type="submit"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

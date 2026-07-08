/**
 * AI SDK UI - Chat with Tool Calling
 *
 * Demonstrates:
 * - Displaying tool calls in UI
 * - Rendering tool arguments and results
 * - Handling multi-step tool invocations
 * - Visual distinction between messages and tool calls
 *
 * Requires:
 * - API route with tools configured (see ai-sdk-core skill)
 * - Backend using `tool()` helper
 *
 * Usage:
 * 1. Set up API route with tools
 * 2. Copy this component
 * 3. Customize tool rendering as needed
 */

"use client"

import { useChat } from "ai/react"
import { type FormEvent, useState } from "react"

export default function ChatWithTools() {
  const { messages, sendMessage, isLoading, error } = useChat({
    api: "/api/chat",
  })
  const [input, setInput] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    sendMessage({ content: input })
    setInput("")
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="font-bold text-2xl">AI Chat with Tools</h1>
        <p className="text-gray-600 text-sm">
          Ask about weather, calculations, or search queries
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div className="space-y-2" key={message.id}>
            {/* Text content */}
            {message.content && (
              <div
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
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
            )}

            {/* Tool invocations */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] space-y-2">
                  {message.toolInvocations.map((tool, idx) => (
                    <div
                      className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                      key={idx}
                    >
                      {/* Tool name */}
                      <div className="mb-2 flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="font-semibold text-blue-900">
                          Tool: {tool.toolName}
                        </span>
                      </div>

                      {/* Tool state */}
                      {tool.state === "call" && (
                        <div className="text-blue-700 text-sm">
                          <strong>Calling with:</strong>
                          <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-xs">
                            {JSON.stringify(tool.args, null, 2)}
                          </pre>
                        </div>
                      )}

                      {tool.state === "result" && (
                        <div className="text-blue-700 text-sm">
                          <strong>Arguments:</strong>
                          <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-xs">
                            {JSON.stringify(tool.args, null, 2)}
                          </pre>
                          <strong className="mt-2 block">Result:</strong>
                          <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-xs">
                            {JSON.stringify(tool.result, null, 2)}
                          </pre>
                        </div>
                      )}

                      {tool.state === "partial-call" && (
                        <div className="text-blue-600 text-sm italic">
                          Preparing arguments...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

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
      </div>

      {/* Error */}
      {error && (
        <div className="border-red-200 border-t bg-red-50 p-4 text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Input */}
      <form className="border-t p-4" onSubmit={handleSubmit}>
        <div className="flex space-x-2">
          <input
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'What's the weather in San Francisco?'"
            value={input}
          />
          <button
            className="rounded-lg bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={isLoading || !input.trim()}
            type="submit"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

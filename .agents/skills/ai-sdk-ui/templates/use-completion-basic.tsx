/**
 * AI SDK UI - Basic Text Completion
 *
 * Demonstrates:
 * - useCompletion hook for text generation
 * - Streaming text completion
 * - Loading states
 * - Stop generation
 * - Clear completion
 *
 * Use cases:
 * - Text generation (blog posts, summaries, etc.)
 * - Content expansion
 * - Writing assistance
 *
 * Usage:
 * 1. Copy this component to your app
 * 2. Create /api/completion route (see references)
 * 3. Customize UI as needed
 */

"use client"

import { useCompletion } from "ai/react"
import { type FormEvent, useState } from "react"

export default function CompletionBasic() {
  const { completion, complete, isLoading, error, stop, setCompletion } =
    useCompletion({
      api: "/api/completion",
    })

  const [input, setInput] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    complete(input)
    setInput("")
  }

  const handleClear = () => {
    setCompletion("")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl">AI Text Completion</h1>
        <p className="mt-2 text-gray-600">
          Enter a prompt to generate text with AI
        </p>
      </div>

      {/* Input form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block font-medium text-gray-700 text-sm"
            htmlFor="prompt"
          >
            Prompt
          </label>
          <textarea
            className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
            id="prompt"
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a blog post about..."
            rows={4}
            value={input}
          />
        </div>

        <div className="flex space-x-2">
          {isLoading ? (
            <button
              className="rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600"
              onClick={stop}
              type="button"
            >
              Stop Generation
            </button>
          ) : (
            <button
              className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={!input.trim()}
              type="submit"
            >
              Generate
            </button>
          )}
          {completion && (
            <button
              className="rounded-lg bg-gray-500 px-6 py-2 text-white hover:bg-gray-600"
              onClick={handleClear}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* Completion output */}
      {(completion || isLoading) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xl">Generated Text</h2>
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 delay-200" />
                <span>Generating...</span>
              </div>
            )}
          </div>
          <div className="whitespace-pre-wrap rounded-lg border bg-gray-50 p-4">
            {completion || "Waiting for response..."}
          </div>
          {!isLoading && completion && (
            <div className="text-gray-600 text-sm">
              {completion.split(/\s+/).length} words, {completion.length}{" "}
              characters
            </div>
          )}
        </div>
      )}

      {/* Example prompts */}
      {!(completion || isLoading) && (
        <div className="space-y-2">
          <h3 className="font-semibold">Example prompts:</h3>
          <div className="space-y-2">
            {[
              "Write a blog post about the future of AI",
              "Explain quantum computing in simple terms",
              "Create a recipe for chocolate chip cookies",
              "Write a product description for wireless headphones",
            ].map((example, idx) => (
              <button
                className="block w-full rounded border p-2 text-left hover:bg-gray-50"
                key={idx}
                onClick={() => setInput(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

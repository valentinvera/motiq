/**
 * AI SDK UI - Custom Message Renderer
 *
 * Demonstrates:
 * - Markdown rendering (react-markdown)
 * - Code syntax highlighting (react-syntax-highlighter)
 * - Custom message components
 * - Copy code button
 * - Timestamp display
 * - User avatars
 *
 * Dependencies:
 * npm install react-markdown react-syntax-highlighter
 * npm install --save-dev @types/react-syntax-highlighter
 *
 * Usage:
 * 1. Install dependencies
 * 2. Copy this component
 * 3. Use <MessageRenderer message={message} /> in your chat
 */

"use client"

import type { Message } from "ai"
import { useChat } from "ai/react"
import { type FormEvent, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"

// Custom message renderer component
function MessageRenderer({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-lg p-4 ${
          message.role === "user"
            ? "bg-blue-500 text-white"
            : "border bg-white shadow-sm"
        }`}
      >
        {/* Avatar & name */}
        <div className="mb-2 flex items-center space-x-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs ${
              message.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {message.role === "user" ? "U" : "AI"}
          </div>
          <span className="font-semibold text-xs">
            {message.role === "user" ? "You" : "Assistant"}
          </span>
        </div>

        {/* Message content with markdown */}
        <div
          className={`prose prose-sm ${
            message.role === "user" ? "prose-invert" : ""
          } max-w-none`}
        >
          <ReactMarkdown
            components={{
              // Custom code block renderer
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                const codeString = String(children).replace(/\n$/, "")

                return !inline && match ? (
                  <div className="group relative">
                    <SyntaxHighlighter
                      className="rounded-lg"
                      language={match[1]}
                      PreTag="div"
                      style={oneDark}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                    <button
                      className="absolute top-2 right-2 rounded bg-gray-700 px-2 py-1 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => copyCode(codeString)}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ) : (
                  <code
                    className={`${
                      message.role === "user" ? "bg-blue-600" : "bg-gray-100"
                    } rounded px-1`}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        <div
          className={`mt-2 text-xs ${
            message.role === "user" ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

// Main chat component
export default function ChatWithCustomRenderer() {
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
    <div className="mx-auto flex h-screen max-w-4xl flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <h1 className="font-bold text-2xl">Custom Message Renderer</h1>
        <p className="text-gray-600 text-sm">
          With markdown, syntax highlighting, and copy buttons
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mb-4 text-6xl">✨</div>
              <h2 className="font-semibold text-gray-700 text-xl">
                Try asking for code examples
              </h2>
              <p className="mt-2 text-gray-500">
                Messages will render with markdown and syntax highlighting
              </p>
              <div className="mt-4 space-y-2">
                {[
                  "Write a Python function to sort a list",
                  "Explain React hooks with code examples",
                  "Show me a TypeScript interface example",
                ].map((suggestion, idx) => (
                  <button
                    className="block w-full rounded border p-2 text-left hover:bg-white"
                    key={idx}
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageRenderer key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg border bg-white p-3">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200" />
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
      <form className="border-t bg-white p-4" onSubmit={handleSubmit}>
        <div className="flex space-x-2">
          <input
            className="flex-1 rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for code examples..."
            value={input}
          />
          <button
            className="rounded-lg bg-blue-500 px-6 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
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

// ============================================================================
// Simpler Version (without react-markdown)
// ============================================================================

/*
// Simple markdown parsing without external dependencies
function SimpleMarkdownRenderer({ content }: { content: string }) {
  // Basic markdown parsing
  const parseMarkdown = (text: string) => {
    // Code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${code}</code></pre>`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/ g, "<strong>$1</strong>"
)

// Italic
text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>")

// Line breaks
text = text.replace(/\n/g, "<br/>")

return text;
}

return (
    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
  );
}
*/

/**
 * AI SDK UI - Message Persistence
 *
 * Demonstrates:
 * - Saving chat history to localStorage
 * - Loading previous conversations
 * - Multiple chat sessions
 * - Clear history functionality
 *
 * Features:
 * - Auto-save on message changes
 * - Persistent chat IDs
 * - Load on mount
 * - Clear/delete chats
 *
 * Usage:
 * 1. Copy this component
 * 2. Customize storage mechanism (localStorage, database, etc.)
 * 3. Add chat history UI if needed
 */

"use client"

import type { Message } from "ai"
import { useChat } from "ai/react"
import { type FormEvent, useEffect, useState } from "react"

// Storage key prefix
const STORAGE_KEY_PREFIX = "ai-chat-"

// Helper functions for localStorage
const saveMessages = (chatId: string, messages: Message[]) => {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${chatId}`,
      JSON.stringify(messages)
    )
  } catch (error) {
    console.error("Failed to save messages:", error)
  }
}

const loadMessages = (chatId: string): Message[] => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Failed to load messages:", error)
    return []
  }
}

const clearMessages = (chatId: string) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${chatId}`)
  } catch (error) {
    console.error("Failed to clear messages:", error)
  }
}

const listChats = (): string[] => {
  const chats: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      chats.push(key.replace(STORAGE_KEY_PREFIX, ""))
    }
  }
  return chats
}

export default function PersistentChat() {
  // Generate or use existing chat ID
  const [chatId, setChatId] = useState<string>("")
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize chat ID
  useEffect(() => {
    // Try to load from URL params or generate new
    const params = new URLSearchParams(window.location.search)
    const urlChatId = params.get("chatId")

    if (urlChatId) {
      setChatId(urlChatId)
    } else {
      // Generate new chat ID
      const newChatId = `chat-${Date.now()}`
      setChatId(newChatId)

      // Update URL
      const url = new URL(window.location.href)
      url.searchParams.set("chatId", newChatId)
      window.history.replaceState({}, "", url.toString())
    }

    setIsLoaded(true)
  }, [])

  const { messages, setMessages, sendMessage, isLoading, error } = useChat({
    api: "/api/chat",
    id: chatId,
    initialMessages: isLoaded ? loadMessages(chatId) : [],
  })

  const [input, setInput] = useState("")

  // Save messages whenever they change
  useEffect(() => {
    if (chatId && messages.length > 0) {
      saveMessages(chatId, messages)
    }
  }, [messages, chatId])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    sendMessage({ content: input })
    setInput("")
  }

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear this chat?")) {
      clearMessages(chatId)
      setMessages([])
    }
  }

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    setChatId(newChatId)
    setMessages([])

    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set("chatId", newChatId)
    window.history.pushState({}, "", url.toString())
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-screen max-w-4xl flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-4">
        <div>
          <h1 className="font-bold text-2xl">Persistent Chat</h1>
          <p className="text-gray-600 text-sm">
            Chat ID: <code className="rounded bg-gray-100 px-1">{chatId}</code>
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={handleNewChat}
          >
            New Chat
          </button>
          {messages.length > 0 && (
            <button
              className="rounded border border-red-300 px-3 py-1 text-red-600 text-sm hover:bg-red-50"
              onClick={handleClearChat}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mb-4 text-6xl">💾</div>
              <h2 className="font-semibold text-gray-700 text-xl">
                Your conversation is saved
              </h2>
              <p className="mt-2 text-gray-500">
                All messages are automatically saved to localStorage
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
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
                  {message.content}
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
        <div className="mx-auto max-w-4xl">
          <div className="flex space-x-2">
            <input
              className="flex-1 rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              value={input}
            />
            <button
              className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={isLoading || !input.trim()}
              type="submit"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-center text-gray-500 text-xs">
            {messages.length > 0 && (
              <>Last saved: {new Date().toLocaleTimeString()}</>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// ============================================================================
// Database Persistence Example (Supabase)
// ============================================================================

/*
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const saveMessagesToDB = async (chatId: string, messages: Message[]) => {
  const { error } = await supabase
    .from('chat_messages')
    .upsert({ chat_id: chatId, messages, updated_at: new Date() });

  if (error) console.error('Save error:', error);
};

const loadMessagesFromDB = async (chatId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('messages')
    .eq('chat_id', chatId)
    .single();

  if (error) {
    console.error('Load error:', error);
    return [];
  }

  return data?.messages || [];
};
*/

/**
 * AI SDK UI - Chat with File Attachments
 *
 * Demonstrates:
 * - File upload with experimental_attachments
 * - Image preview
 * - Multiple file support
 * - Sending files with messages
 *
 * Requires:
 * - API route that handles multimodal inputs (GPT-4 Vision, Claude 3.5, etc.)
 * - experimental_attachments feature (v5)
 *
 * Usage:
 * 1. Set up API route with vision model
 * 2. Copy this component
 * 3. Customize file handling as needed
 */

"use client"

import { useChat } from "ai/react"
import { type FormEvent, useState } from "react"

export default function ChatWithAttachments() {
  const { messages, sendMessage, isLoading, error } = useChat({
    api: "/api/chat",
  })
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    setFiles(selectedFiles)

    if (selectedFiles) {
      // Create preview URLs
      const urls = Array.from(selectedFiles).map((file) =>
        URL.createObjectURL(file)
      )
      setPreviewUrls(urls)
    } else {
      setPreviewUrls([])
    }
  }

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!(input.trim() || files)) return

    sendMessage({
      content: input || "Please analyze these images",
      experimental_attachments: files
        ? Array.from(files).map((file) => ({
            name: file.name,
            contentType: file.type,
            url: URL.createObjectURL(file),
          }))
        : undefined,
    })

    // Clean up
    setInput("")
    setFiles(null)
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
  }

  // Remove file
  const removeFile = (index: number) => {
    if (!files) return

    const newFiles = Array.from(files).filter((_, i) => i !== index)
    const dataTransfer = new DataTransfer()
    newFiles.forEach((file) => dataTransfer.items.add(file))

    setFiles(dataTransfer.files)

    // Update preview URLs
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(previewUrls.filter((_, i) => i !== index))
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="font-bold text-2xl">AI Chat with File Attachments</h1>
        <p className="text-gray-600 text-sm">
          Upload images and ask questions about them
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div className="space-y-2" key={message.id}>
            {/* Text content */}
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

            {/* Attachments */}
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="grid max-w-[70%] grid-cols-2 gap-2">
                    {message.experimental_attachments.map((attachment, idx) => (
                      <div className="relative" key={idx}>
                        {attachment.contentType?.startsWith("image/") ? (
                          <img
                            alt={attachment.name}
                            className="max-h-40 rounded-lg object-cover"
                            src={attachment.url}
                          />
                        ) : (
                          <div className="rounded-lg bg-gray-100 p-2 text-sm">
                            {attachment.name}
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
            <div className="rounded-lg bg-gray-200 p-3">Processing...</div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border-red-200 border-t bg-red-50 p-4 text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {/* File preview */}
      {previewUrls.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <p className="mb-2 text-gray-700 text-sm">
            Selected files ({previewUrls.length}):
          </p>
          <div className="grid grid-cols-4 gap-2">
            {previewUrls.map((url, idx) => (
              <div className="relative" key={idx}>
                <img
                  alt={`Preview ${idx + 1}`}
                  className="h-20 w-full rounded-lg object-cover"
                  src={url}
                />
                <button
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                  onClick={() => removeFile(idx)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form className="border-t p-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          {/* File input */}
          <label className="flex cursor-pointer items-center space-x-2">
            <div className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">
              📎 Attach Files
            </div>
            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={handleFileChange}
              type="file"
            />
            {files && (
              <span className="text-gray-600 text-sm">
                {files.length} file(s)
              </span>
            )}
          </label>

          {/* Text input */}
          <div className="flex space-x-2">
            <input
              className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the images..."
              value={input}
            />
            <button
              className="rounded-lg bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={isLoading || !(input.trim() || files)}
              type="submit"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

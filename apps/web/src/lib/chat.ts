export async function createChat(message: string) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/new`, {
    body: JSON.stringify({ message }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error((await response.text()) || "Failed to create chat")
  }

  return (await response.json()) as { id: string }
}

export interface ChatListItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export async function listChats() {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error((await response.text()) || "Failed to load chats")
  }

  return (await response.json()) as { items: ChatListItem[] }
}

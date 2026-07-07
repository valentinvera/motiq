import { Buffer } from "node:buffer"
import { auth } from "@motiq/auth"
import { db } from "@motiq/db"
import { account, member } from "@motiq/db/schema/auth"
import { env } from "@motiq/env/api"
import { del, get, put } from "@vercel/blob"
import { and, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
])
const MAX_BYTES = 4 * 1024 * 1024
const LEADING_SLASHES_REGEX = /^\/+/

const app = new Hono()

async function readFile(c: Context) {
  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return { error: c.json({ error: "Invalid form data" }, 400) }
  }
  const file = form.get("file")
  if (!(file instanceof File)) {
    return { error: c.json({ error: "Missing file" }, 400) }
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: c.json({ error: "Unsupported file type" }, 400) }
  }
  if (file.size > MAX_BYTES) {
    return { error: c.json({ error: "File too large (max 4MB)" }, 400) }
  }
  return { file }
}

async function uploadImage(file: File, pathname: string) {
  try {
    const blob = await put(pathname, file, {
      access: "private",
      contentType: file.type,
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    })
    return blob.url
  } catch (error) {
    console.error("[upload] Blob upload failed:", error)
    throw new Error("Failed to upload image")
  }
}

function pathExt(file: File): string {
  return file.type.split("/")[1] ?? "png"
}

function isVercelBlobUrl(url: URL) {
  return url.hostname.endsWith(".blob.vercel-storage.com")
}

function parseBlobUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  if (!isVercelBlobUrl(url)) {
    throw new Error("Unsupported media URL")
  }

  return {
    access: url.hostname.endsWith(".private.blob.vercel-storage.com")
      ? "private"
      : "public",
    pathname: decodeURIComponent(
      url.pathname.replace(LEADING_SLASHES_REGEX, "")
    ),
  } as const
}

async function readJsonUrl(c: Context) {
  const data = (await c.req.json().catch(() => null)) as {
    url?: unknown
  } | null

  return typeof data?.url === "string" ? data.url : null
}

async function deleteOwnedBlob(params: {
  url: string | null
  kind: "avatars" | "workspace-logos"
  ownerId: string
}) {
  if (!params.url) {
    return
  }

  let blobUrl: ReturnType<typeof parseBlobUrl>
  try {
    blobUrl = parseBlobUrl(params.url)
  } catch {
    return
  }

  const [kind, ownerId] = blobUrl.pathname.split("/")
  if (kind !== params.kind || ownerId !== params.ownerId) {
    return
  }

  try {
    await del(params.url, { token: env.BLOB_READ_WRITE_TOKEN })
  } catch (error) {
    console.error("[upload] Blob delete failed:", error)
  }
}

function getPictureFromIdToken(idToken: string | null) {
  if (!idToken) {
    return null
  }

  try {
    const payload = idToken.split(".")[1]
    if (!payload) {
      return null
    }
    const normalized = payload.replaceAll("-", "+").replaceAll("_", "/")
    const decoded = JSON.parse(
      Buffer.from(normalized, "base64").toString("utf8")
    ) as { picture?: unknown }
    return typeof decoded.picture === "string" ? decoded.picture : null
  } catch {
    return null
  }
}

async function getGoogleProfileImage(userId: string) {
  const [googleAccount] = await db
    .select({
      accessToken: account.accessToken,
      idToken: account.idToken,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1)

  if (!googleAccount) {
    return null
  }

  const idTokenPicture = getPictureFromIdToken(googleAccount.idToken)
  if (idTokenPicture) {
    return idTokenPicture
  }

  if (!googleAccount.accessToken) {
    return null
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleAccount.accessToken}`,
        },
      }
    )
    if (!response.ok) {
      return null
    }
    const data = (await response.json()) as { picture?: unknown }
    return typeof data.picture === "string" ? data.picture : null
  } catch {
    return null
  }
}

async function canReadAvatar(params: {
  currentUserId: string
  activeOrganizationId: string | null
  targetUserId: string
}) {
  if (params.currentUserId === params.targetUserId) {
    return true
  }
  if (!params.activeOrganizationId) {
    return false
  }

  const rows = await db
    .select({ userId: member.userId })
    .from(member)
    .where(
      and(
        eq(member.organizationId, params.activeOrganizationId),
        eq(member.userId, params.currentUserId)
      )
    )

  if (rows.length === 0) {
    return false
  }

  const [targetMembership] = await db
    .select({ userId: member.userId })
    .from(member)
    .where(
      and(
        eq(member.organizationId, params.activeOrganizationId),
        eq(member.userId, params.targetUserId)
      )
    )
    .limit(1)

  return Boolean(targetMembership)
}

async function canReadWorkspaceLogo(params: {
  currentUserId: string
  organizationId: string
}) {
  const [membership] = await db
    .select({ userId: member.userId })
    .from(member)
    .where(
      and(
        eq(member.organizationId, params.organizationId),
        eq(member.userId, params.currentUserId)
      )
    )
    .limit(1)

  return Boolean(membership)
}

app.get("/media", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const rawUrl = c.req.query("url")
  if (!rawUrl) {
    return c.json({ error: "Missing media URL" }, 400)
  }

  let blobUrl: ReturnType<typeof parseBlobUrl>
  try {
    blobUrl = parseBlobUrl(rawUrl)
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Invalid media URL" },
      400
    )
  }

  const sessionData = session.session as Record<string, unknown>
  const activeOrganizationId =
    (sessionData.activeOrganizationId as string | undefined) ?? null
  const parts = blobUrl.pathname.split("/")
  const [kind, ownerId] = parts
  if (!(kind && ownerId) || parts.length < 3) {
    return c.json({ error: "Invalid media URL" }, 400)
  }

  let allowed = false
  if (kind === "avatars") {
    allowed = await canReadAvatar({
      currentUserId: session.user.id,
      activeOrganizationId,
      targetUserId: ownerId,
    })
  } else if (kind === "workspace-logos") {
    allowed = await canReadWorkspaceLogo({
      currentUserId: session.user.id,
      organizationId: ownerId,
    })
  }

  if (!allowed) {
    return c.json({ error: "Forbidden" }, 403)
  }

  const result = await get(rawUrl, {
    access: blobUrl.access,
    token: env.BLOB_READ_WRITE_TOKEN,
  })
  if (!result || result.statusCode === 304 || !result.stream) {
    return c.json({ error: "Media not found" }, 404)
  }

  return new Response(result.stream, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": result.blob.contentType,
      ETag: result.blob.etag,
    },
  })
})

app.post("/avatar", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const result = await readFile(c)
  if ("error" in result) {
    return result.error
  }

  try {
    const url = await uploadImage(
      result.file,
      `avatars/${session.user.id}/${Date.now()}.${pathExt(result.file)}`
    )
    return c.json({ url })
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      500
    )
  }
})

app.delete("/avatar", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  await deleteOwnedBlob({
    url: await readJsonUrl(c),
    kind: "avatars",
    ownerId: session.user.id,
  })

  const image = await getGoogleProfileImage(session.user.id)
  return c.json({ image })
})

app.post("/workspace-logo", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const sessionData = session.session as Record<string, unknown>
  const organizationId = (sessionData.activeOrganizationId as string) ?? null
  if (!organizationId) {
    return c.json({ error: "No active workspace" }, 400)
  }

  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, organizationId)
      )
    )
    .limit(1)
  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return c.json({ error: "Forbidden" }, 403)
  }

  const result = await readFile(c)
  if ("error" in result) {
    return result.error
  }

  try {
    const url = await uploadImage(
      result.file,
      `workspace-logos/${organizationId}/${Date.now()}.${pathExt(result.file)}`
    )
    return c.json({ url })
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      500
    )
  }
})

app.delete("/workspace-logo", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const sessionData = session.session as Record<string, unknown>
  const organizationId = (sessionData.activeOrganizationId as string) ?? null
  if (!organizationId) {
    return c.json({ error: "No active workspace" }, 400)
  }

  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, organizationId)
      )
    )
    .limit(1)
  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return c.json({ error: "Forbidden" }, 403)
  }

  await deleteOwnedBlob({
    url: await readJsonUrl(c),
    kind: "workspace-logos",
    ownerId: organizationId,
  })

  return c.json({ success: true })
})

export default app

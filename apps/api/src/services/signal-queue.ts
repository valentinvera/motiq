import { redis } from "@motiq/cache"

const QUEUE_KEY = "motiq:signal-queue"
const FAILED_QUEUE_KEY = "motiq:signal-queue:failed"

export interface SignalJob {
  signalId: string
  organizationId: string
  source: string
  createdAt: string
  attempts?: number
  lastError?: string
}

type StoredSignalJob = SignalJob | string

function normalizeSignalJob(raw: StoredSignalJob): SignalJob {
  if (typeof raw !== "string") {
    return raw
  }

  return JSON.parse(raw) as SignalJob
}

export async function enqueueSignal(job: SignalJob): Promise<void> {
  await redis.lpush(QUEUE_KEY, job)
}

export async function dequeueSignal(): Promise<SignalJob | null> {
  const raw = await redis.rpop<StoredSignalJob>(QUEUE_KEY)
  if (!raw) {
    return null
  }
  return normalizeSignalJob(raw)
}

export async function getQueueLength(): Promise<number> {
  return await redis.llen(QUEUE_KEY)
}

export async function retrySignal(
  job: SignalJob,
  error: unknown
): Promise<void> {
  const attempts = (job.attempts ?? 0) + 1
  const lastError = error instanceof Error ? error.message : "Unknown error"

  if (attempts >= 3) {
    await redis.lpush(FAILED_QUEUE_KEY, {
      ...job,
      attempts,
      lastError,
      failedAt: new Date().toISOString(),
    })
    return
  }

  await enqueueSignal({
    ...job,
    attempts,
    lastError,
  })
}

import { env } from "@motiq/env/api"
import { Hono } from "hono"
import { sendWeeklyAnalysisDigests } from "../services/actions/weekly-analysis-digest.js"
import { processNextSignal } from "../services/signal-processor.js"
import { pollSlackApps } from "../services/workers/slack-poller.js"

export const cron = new Hono()

function isAuthorized(authorization: string | undefined) {
  return Boolean(
    env.CRON_SECRET && authorization === `Bearer ${env.CRON_SECRET}`
  )
}

cron.get("/weekly-analysis", async (c) => {
  if (!isAuthorized(c.req.header("authorization"))) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const result = await sendWeeklyAnalysisDigests()
  return c.json(result)
})

cron.get("/slack-poll", async (c) => {
  if (!isAuthorized(c.req.header("authorization"))) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const slack = await pollSlackApps()
  let processedSignals = 0
  const maxSignalsPerRun = 5

  while (processedSignals < maxSignalsPerRun) {
    const processed = await processNextSignal()
    if (!processed) {
      break
    }
    processedSignals += 1
  }

  return c.json({ slack, processedSignals })
})

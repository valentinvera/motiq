import { env } from "@motiq/env/api"
import { Hono } from "hono"
import { sendWeeklyAnalysisDigests } from "../services/actions/weekly-analysis-digest"

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

import { trpcServer } from "@hono/trpc-server"
import { auth } from "@motiq/auth"
import { env } from "@motiq/env/api"
import { createContext } from "@motiq/trpc/context"
import { appRouter } from "@motiq/trpc/routers"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { rateLimit } from "./middleware/rate-limit.js"
import { polar } from "./routes/apps/polar.js"
import { slack } from "./routes/apps/slack.js"
import chat from "./routes/chat.js"
import { cron } from "./routes/cron.js"
import { sse } from "./routes/sse.js"
import upload from "./routes/upload.js"
import { startAgentScheduler } from "./services/agent-scheduler.js"
import { startSignalProcessor } from "./services/signal-processor.js"
import { runSlackPoller } from "./services/workers/slack-poller.js"

const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.use(
  "/api/auth/*",
  rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "rl:auth" })
)
app.use(
  "/api/chat/*",
  rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "rl:chat" })
)
app.use(
  "/api/trpc/*",
  rateLimit({ windowMs: 60_000, max: 100, keyPrefix: "rl:trpc" })
)
app.use(
  "/api/upload/*",
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "rl:upload" })
)

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  })
)

app.route("/api/chat", chat)
app.route("/api/apps/slack", slack)
app.route("/api/apps/polar", polar)
app.route("/api/sse", sse)
app.route("/api/upload", upload)
app.route("/api/cron", cron)

startSignalProcessor()
startAgentScheduler()
runSlackPoller()

export default {
  port: Number(env.PORT),
  fetch: app.fetch,
  idleTimeout: 255,
}

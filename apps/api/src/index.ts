import { trpcServer } from "@hono/trpc-server"
import { auth } from "@motiq/auth"
import { env } from "@motiq/env/api"
import { createContext } from "@motiq/trpc/context"
import { appRouter } from "@motiq/trpc/routers"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { handle } from "hono/vercel"

const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  })
)

export default handle(app)

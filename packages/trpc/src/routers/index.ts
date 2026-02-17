import { router } from "../index"
import { waitlistRouter } from "./waitlist"

export const appRouter = router({
  waitlist: waitlistRouter,
})

export type AppRouter = typeof appRouter

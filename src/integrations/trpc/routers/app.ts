import { createTRPCRouter } from "../init"
import { waitlistRouter } from "./waitlist"
import { emailRouter } from "./email"

export const appRouter = createTRPCRouter({
  waitlist: waitlistRouter,
  email: emailRouter,
})

export type AppRouter = typeof appRouter

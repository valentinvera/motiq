import { joinWaitlist } from "@motiq/mail/resend"
import { TRPCError } from "@trpc/server"
import { count } from "drizzle-orm"
import { z } from "zod"
import { publicProcedure, router } from "../index"

export const waitlistRouter = router({
  join: publicProcedure
    .input(
      z.object({
        email: z.email(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await joinWaitlist(input.email)

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.message,
        })
      }

      return { success: true, message: result.message }
    }),

  count: publicProcedure.query(async () => {
    const { db } = await import("@motiq/db")
    const { waitlist } = await import("@motiq/db/schema/waitlist")
    const result = await db.select({ count: count() }).from(waitlist)
    return { count: result[0]?.count ?? 0 }
  }),
})

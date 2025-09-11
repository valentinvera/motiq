import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "@/integrations/trpc/init"
import { sendWaitlistEmail } from "@/lib/send-waitlist-email"

export const emailRouter = createTRPCRouter({
  sendWelcome: publicProcedure
    .input(z.object({ to: z.email(), name: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await sendWaitlistEmail({ to: input.to, name: input.name })
        return { success: true }
      } catch (error) {
        console.error(error)
        return { success: false }
      }
    }),
})

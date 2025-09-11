import { z } from "zod"
import { count, eq } from "drizzle-orm"
import { createTRPCRouter, publicProcedure } from "@/integrations/trpc/init"
import { db } from "@/db/drizzle"
import { waitlist } from "@/db/schema"

export const waitlistRouter = createTRPCRouter({
  join: publicProcedure.input(z.object({ email: z.email() })).mutation(async ({ input }) => {
    const existing = await db.query.waitlist.findFirst({
      where: eq(waitlist.email, input.email),
    })

    if (existing) {
      return { success: true, message: "You are already on the waitlist!" }
    }

    await db.insert(waitlist).values({ id: crypto.randomUUID(), email: input.email })

    return { success: true, message: "You have been added to the waitlist!" }
  }),
  count: publicProcedure.query(async () => {
    const result = await db.select({ value: count() }).from(waitlist)
    return result[0]?.value ?? 0
  }),
})

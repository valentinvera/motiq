import { Button } from "@motiq/ui/components/button"
import { Input } from "@motiq/ui/components/input"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { useTRPC } from "@/utils/trpc"

export const Hero = () => {
  const [email, setEmail] = useState("")
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: waitlistData } = useQuery(trpc.waitlist.count.queryOptions())

  const joinWaitlist = useMutation({
    ...trpc.waitlist.join.mutationOptions(),
    onSuccess: (data) => {
      if (data.success) {
        if (data.message === "You're already on the list!") {
          toast.info("You're already on the waitlist!")
        } else {
          toast.success("You're on the list!")
          setEmail("")
          queryClient.invalidateQueries(trpc.waitlist.count.queryOptions())
        }
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      return
    }
    joinWaitlist.mutate({ email })
  }

  return (
    <section className="relative min-h-dvh bg-zinc-950 pt-12 selection:bg-lime-500/30 selection:text-lime-200 md:pt-16">
      <div className="relative mx-auto flex min-h-[calc(100dvh-64px)] max-w-7xl flex-col items-center border-white/5 border-x">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="halftone pointer-events-none absolute inset-0 opacity-[0.02]" />
        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 pt-16 pb-12 text-center md:pt-20 md:pb-20">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1"
            initial={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-500 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
            <span className="font-bold font-mono text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
              Autonomous Customer Intelligence
            </span>
          </motion.div>
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="font-bold text-5xl text-white leading-[0.85] tracking-tighter sm:text-7xl md:text-8xl lg:text-[110px]"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Stop Missing <br />
            <span className="text-lime-400">Critical Signals.</span>
          </motion.h1>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 mb-12 max-w-xl text-lg text-zinc-400 leading-relaxed md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Autonomous customer intelligence that monitors feedback 24/7. We
            triage the noise so you can focus on growth.
          </motion.p>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <form
              className="flex flex-col gap-2 rounded-sm border border-white/10 bg-white/5 p-1 sm:flex-row"
              onSubmit={handleSubmit}
            >
              <Input
                aria-label="Email address"
                className="h-11 border-none bg-transparent px-4 text-center text-white placeholder:text-zinc-600 focus:ring-0 sm:text-left"
                disabled={joinWaitlist.isPending}
                id="waitlist-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                type="email"
                value={email}
              />
              <Button
                className="h-11 cursor-pointer rounded-sm bg-white px-6 font-bold text-zinc-950 transition-all hover:bg-lime-400"
                disabled={joinWaitlist.isPending}
                type="submit"
              >
                {joinWaitlist.isPending ? "..." : "Join Waitlist"}
              </Button>
            </form>
            <div className="mt-6 flex items-center justify-center gap-4 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                {waitlistData?.count ?? 0} on the waitlist
              </span>
              <span className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                Beta Access v0.1
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

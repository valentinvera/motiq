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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black pt-20">
      {/* Gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[90%] rounded-full bg-cyan-500/20 blur-[120px] md:bottom-[-38%] md:h-[70%] md:w-[70%] md:bg-cyan-500/15 md:blur-[150px]" />
        <div className="absolute right-[-15%] bottom-[-5%] h-[40%] w-[80%] rounded-full bg-teal-500/15 blur-[120px] md:bottom-[-28%] md:h-[60%] md:w-[60%] md:bg-teal-500/12 md:blur-[150px]" />
        <div className="absolute top-[55%] left-[20%] h-[50%] w-[70%] rounded-full bg-cyan-400/5 blur-[150px]" />
      </div>
      {/* Bottom fade to black */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black" />

      <div className="w-full max-w-5xl px-6 text-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <div className="size-2 animate-pulse rounded-full bg-white" />
            <span className="font-medium text-[11px] text-white/70 uppercase tracking-[0.2em]">
              Autonomous Intelligence Engine
            </span>
          </div>

          <h1 className="font-medium text-6xl text-white leading-[0.9] tracking-tighter sm:text-7xl md:text-8xl lg:text-[110px]">
            Stop staring at dashboards.
          </h1>

          <p className="mt-4 max-w-2xl font-light text-lg text-white/50 leading-relaxed md:text-xl">
            Motiq builds a relational memory graph of your users and takes
            autonomous action to prevent churn. We don't just show data—we
            execute the solution.
          </p>

          <div className="mt-10 w-full max-w-md">
            <form
              className="flex w-full flex-col gap-2 sm:flex-row"
              onSubmit={handleSubmit}
            >
              <Input
                aria-label="Email address"
                className="h-14 rounded-sm border border-white/10 bg-white/5 px-6 text-white transition-all placeholder:text-white/30 focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-white/50"
                disabled={joinWaitlist.isPending}
                id="waitlist-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                type="email"
                value={email}
              />
              <Button
                className="h-14 cursor-pointer rounded-sm bg-white px-8 text-black transition-all hover:bg-white/80 active:scale-95"
                disabled={joinWaitlist.isPending}
                type="submit"
              >
                {joinWaitlist.isPending ? "..." : "Join Waitlist"}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-6 font-mono text-[11px] text-white/40 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {waitlistData?.count ?? 0}
                </span>{" "}
                already on the waitlist
              </span>
              <span className="h-px w-4 bg-white/20" />
              <span>Includes 90-Day Scan</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

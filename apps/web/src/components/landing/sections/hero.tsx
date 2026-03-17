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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black pt-24 md:pt-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[5%] left-[-10%] h-[50%] w-[90%] rounded-full bg-cyan-500/20 blur-[120px] md:bottom-[-38%] md:h-[70%] md:w-[70%] md:bg-cyan-500/15 md:blur-[150px]" />
        <div className="absolute right-[-15%] bottom-[10%] h-[40%] w-[80%] rounded-full bg-teal-500/15 blur-[120px] md:bottom-[-28%] md:h-[60%] md:w-[60%] md:bg-teal-500/12 md:blur-[150px]" />
        <div className="absolute top-[55%] left-[20%] h-[50%] w-[70%] rounded-full bg-cyan-400/5 blur-[150px]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-black" />

      <div className="w-full max-w-6xl px-6 text-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 md:gap-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <div className="size-2 animate-pulse rounded-full bg-white" />
            <span className="font-medium text-[11px] text-white/70 uppercase tracking-[0.2em]">
              Powered by AI Agents
            </span>
          </div>

          <h1 className="flex flex-col items-center font-medium text-[40px] text-white leading-[0.9] tracking-tighter sm:text-[50px] md:text-[65px] lg:text-[80px] xl:text-[96px] 2xl:text-[110px]">
            <span className="text-balance text-center lg:whitespace-nowrap">
              Autonomous intelligence
            </span>
            <span className="text-balance text-center text-white/40 lg:whitespace-nowrap">
              for customer teams.
            </span>
          </h1>

          <p className="mt-1 max-w-2xl font-light text-base text-white/50 leading-relaxed md:mt-4 md:text-xl">
            AI agents that monitor every feedback channel 24/7, detect churn
            before it happens, and act autnomously — so your team can focus on
            building, not firefighting.
          </p>

          <div className="mt-4 w-full max-w-md md:mt-10">
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

            <div className="mt-6 flex flex-col items-center justify-center gap-2 font-mono text-[11px] text-white/60 uppercase tracking-widest sm:flex-row sm:gap-6 sm:text-white/40">
              <span className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {waitlistData?.count ?? 0}
                </span>{" "}
                already on the waitlist
              </span>
              <span className="hidden h-px w-4 bg-white/20 sm:block" />
              <span>Includes 90-Day Scan</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

import { Button } from "@motiq/ui/components/button"
import { Input } from "@motiq/ui/components/input"
import { Spotlight } from "@motiq/ui/components/spotlight"
import { Sparkles } from "@motiq/ui/icons/sparkles"
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
    <section className="relative flex flex-col items-center overflow-hidden bg-zinc-950 pt-6 antialiased md:pt-8">
      <Spotlight
        className="-top-40 left-0 z-0 opacity-50 md:-top-20 md:left-60 md:opacity-100"
        fill="white"
      />

      <div className="relative z-10 flex flex-col items-center px-4 py-20 text-center md:py-32">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-500/20 bg-lime-500/10 px-4 py-2 font-medium text-lime-400 text-sm"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="h-4 w-4" />
          <span>Autonomous Customer Intelligence</span>
        </motion.div>

        <h1 className="mb-8 bg-linear-to-b from-neutral-200 to-neutral-600 bg-clip-text font-bold text-4xl text-transparent md:text-[65px] min-[575px]:text-5xl min-[690px]:text-6xl dark:from-neutral-200 dark:to-neutral-500">
          Stop Missing <br />
          <span className="mt-1 font-bold text-lime-400 leading-none">
            Critical Customer Signals
          </span>
        </h1>

        <motion.p
          animate={{ opacity: 1 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          AI agents that monitor customer feedback 24/7, auto-triage critical
          issues, and alert you before small problems become churn.
        </motion.p>

        <div className="mx-auto mb-6 w-full max-w-lg px-4 sm:px-0">
          <form
            className="flex w-full flex-col gap-3 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <Input
              aria-label="Email address"
              className="h-12 w-full border-zinc-800 bg-zinc-900/50 text-white sm:flex-1"
              disabled={joinWaitlist.isPending}
              id="waitlist-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              type="email"
              value={email}
            />
            <Button
              className="h-12 w-full cursor-pointer bg-lime-500 px-6 font-semibold text-zinc-950 hover:bg-lime-400 sm:w-auto"
              disabled={joinWaitlist.isPending}
              type="submit"
            >
              {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
            </Button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                className="h-6 w-6 rounded-full border-2 border-zinc-950 bg-zinc-800"
                key={i}
              />
            ))}
          </div>
          <p>
            Join{" "}
            <span className="font-medium text-zinc-300">
              {waitlistData?.count ?? 0}+ early adopters
            </span>{" "}
            in early access
          </p>
        </div>
      </div>

      {/* Trusted by innovators — uncomment when ready
      <motion.div
        className="relative z-20 mt-10 flex flex-col items-center gap-8 pb-32 md:mt-12.5"
        initial={{ opacity: 0 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1 }}
      >
        <p className="font-medium text-sm text-zinc-500 uppercase tracking-widest">
          Trusted by innovators
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {logos.map(({ icon: Logo, name, hoverColor, isMulticolor }) => (
            <Logo
              className={`h-8 w-auto transition-all duration-300 ${
                isMulticolor
                  ? "brightness-[0.7] grayscale hover:brightness-100 hover:grayscale-0"
                  : `text-zinc-400 ${hoverColor}`
              }`}
              key={name}
            />
          ))}
        </div>
      </motion.div>
      */}
    </section>
  )
}

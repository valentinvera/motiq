import { toast } from "sonner"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TextEffect } from "./ui/text-effect"
import { AnimatedGroup } from "./ui/animated-group"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useTRPCClient } from "@/integrations/trpc/react"

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
} as const

export const Hero = () => {
  const [email, setEmail] = useState("")
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()

  const { data: waitlistCount } = useQuery({
    queryKey: ["waitlist.count"],
    queryFn: () => trpcClient.waitlist.count.query(),
  })

  const { mutate: sendEmail } = useMutation({
    mutationFn: async () => {
      return await trpcClient.email.sendWelcome.mutate({ to: email, name: email.split("@")[0] })
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await trpcClient.waitlist.join.mutate({ email })
    },
    onSuccess: () => {
      toast.success("You have been added to the waitlist!")
      setEmail("")
      queryClient.invalidateQueries({ queryKey: ["waitlist.count"] })
      sendEmail()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutate()
  }

  return (
    <>
      <section>
        <div className="relative pt-24 md:pt-32">
          <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"></div>
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center sm:mx-auto lg:mt-0 lg:mr-auto">
              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="h1"
                className="mt-8 text-6xl text-balance md:text-7xl lg:mt-16 xl:text-[5.25rem]"
              >
                AI-Powered Forms: Build, Share & Analyze in Minutes
              </TextEffect>
              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="p"
                className="mx-auto mt-8 max-w-2xl text-lg text-balance"
              >
                Skip the setup — just chat, generate, and get insights.
              </TextEffect>

              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="mt-8 flex flex-col items-center justify-center gap-2"
              >
                <form
                  id="waitlist"
                  onSubmit={handleSubmit}
                  className="flex scroll-mt-34 flex-col items-center justify-center gap-4 md:flex-row md:gap-2"
                >
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="cursor-pointer" disabled={isPending}>
                    Join Waitlist
                  </Button>
                </form>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{waitlistCount}</span> people have
                  already joined
                </p>
              </AnimatedGroup>
            </div>
          </div>

          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.75,
                  },
                },
              },
              ...transitionVariants,
            }}
          >
            <div className="relative mt-8 -mr-56 overflow-hidden px-2 sm:mt-12 sm:mr-0 md:mt-30">
              <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border bg-background p-4 shadow-lg ring-1 inset-shadow-2xs shadow-zinc-950/15 ring-background dark:inset-shadow-white/20">
                <img
                  className="relative hidden aspect-15/8 rounded-2xl bg-background dark:block"
                  src="/mail2.png"
                  alt="app screen"
                  width="2700"
                  height="1440"
                />
                <img
                  className="relative z-2 aspect-15/8 rounded-2xl border border-border/25 dark:hidden"
                  src="/mail2-light.png"
                  alt="app screen"
                  width="2700"
                  height="1440"
                />
              </div>
            </div>
          </AnimatedGroup>
        </div>
      </section>
    </>
  )
}

"use client"
import { motion, useMotionValueEvent, useScroll } from "motion/react"
import React, { useRef } from "react"
import { cn } from "../lib/utils"

export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string
    description: string
    content?: React.ReactNode
  }[]
  contentClassName?: string
}) => {
  const [activeCard, setActiveCard] = React.useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    // target: ref,
    container: ref,
    offset: ["start start", "end start"],
  })
  const cardLength = content.length

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength)
    const closest = cardsBreakpoints.reduce((prev, curr) => {
      return Math.abs(curr - latest) < Math.abs(prev - latest) ? curr : prev
    })
    const index = cardsBreakpoints.indexOf(closest)
    setActiveCard(index)
  })

  const backgroundColors = [
    "var(--zinc-950)",
    "var(--zinc-950)",
    "var(--zinc-950)",
  ]
  const linearGradients = [
    "linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
    "linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))",
    "linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))",
  ]

  const [backgroundGradient, setBackgroundGradient] = React.useState(
    linearGradients[0]
  )

  React.useEffect(() => {
    setBackgroundGradient(linearGradients[activeCard % linearGradients.length])
  }, [activeCard])

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      className="scrollbar-hide relative flex h-120 justify-center space-x-10 overflow-y-auto rounded-md p-10"
      ref={ref}
    >
      <div className="div relative flex items-start px-4">
        <div className="max-w-2xl">
          {content.map((item, index) => (
            <div className="my-20" key={item.title}>
              <motion.h2
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="font-bold text-2xl text-slate-100"
                initial={{
                  opacity: 0,
                }}
              >
                {item.title}
              </motion.h2>
              <motion.p
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="mt-10 max-w-sm text-kg text-slate-300"
                initial={{
                  opacity: 0,
                }}
              >
                {item.description}
              </motion.p>
            </div>
          ))}
          <div className="h-40" />
        </div>
      </div>
      <div
        className={cn(
          "sticky top-10 hidden h-60 w-80 overflow-hidden rounded-md bg-white lg:block",
          contentClassName
        )}
        style={{ background: backgroundGradient }}
      >
        {content[activeCard]?.content ?? null}
      </div>
    </motion.div>
  )
}

"use client"
import { motion, useInView, useScroll, useTransform } from "motion/react"
import type React from "react"
import { useEffect, useRef, useState } from "react"

interface TimelineEntry {
  title: string
  content: React.ReactNode
}

function TimelineItem({ item }: { item: TimelineEntry }) {
  const itemRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(itemRef, { margin: "-40% 0px -40% 0px" })

  return (
    <div className="flex justify-start pt-10 md:gap-10 md:pt-20" ref={itemRef}>
      <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
        <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 md:left-3">
          <div className="h-4 w-4 rounded-full border border-zinc-700 bg-zinc-800 p-2" />
        </div>
        <h3
          className={`hidden font-bold text-xl transition-colors duration-300 md:block md:pl-20 md:text-5xl ${
            isInView ? "text-white" : "text-zinc-500"
          }`}
        >
          {item.title}
        </h3>
      </div>

      <div className="relative w-full pr-4 pl-20 md:pl-4">
        <h3
          className={`mb-4 block text-left font-bold text-2xl transition-colors duration-300 md:hidden ${
            isInView ? "text-white" : "text-zinc-500"
          }`}
        >
          {item.title}
        </h3>
        {item.content}
      </div>
    </div>
  )
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setHeight(rect.height)
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  })

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  return (
    <div
      className="relative w-full bg-zinc-950 font-sans md:px-10"
      ref={containerRef}
    >
      <motion.div
        className="mx-auto max-w-7xl px-4 pt-20 pb-4 md:px-8 lg:px-10"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <span className="mb-4 inline-block font-medium text-lime-400 text-sm uppercase tracking-wider">
          How it works
        </span>
        <h2 className="mb-6 max-w-4xl font-bold text-3xl tracking-tight md:text-5xl">
          <span className="bg-linear-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            From feedback{" "}
          </span>
          <span className="text-lime-400">chaos</span>
          <span className="bg-linear-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            {" "}
            to proactive action
          </span>
        </h2>
        <p className="max-w-2xl text-base text-zinc-400 md:text-lg">
          Connect once. Let AI handle the rest. Our agents monitor feedback
          24/7, detect patterns, and alert you before issues escalate.
        </p>
      </motion.div>

      <div className="relative mx-auto max-w-7xl pb-20" ref={ref}>
        {data.map((item) => (
          <TimelineItem item={item} key={item.title} />
        ))}
        <div
          className="absolute top-0 left-8 w-0.5 overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-[0%] from-transparent via-zinc-800 to-[99%] to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8"
          style={{
            height: `${height}px`,
          }}
        >
          <motion.div
            className="absolute inset-x-0 top-0 w-0.5 rounded-full bg-linear-to-t from-0% from-lime-500 via-[10%] via-lime-400 to-transparent"
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
          />
        </div>
      </div>
    </div>
  )
}

"use client"
import React, { useEffect, useState } from "react"
import { cn } from "../lib/utils"

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string
    name: string
    title: string
  }[]
  direction?: "left" | "right"
  speed?: "fast" | "normal" | "slow"
  pauseOnHover?: boolean
  className?: string
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const scrollerRef = React.useRef<HTMLUListElement>(null)

  const [start, setStart] = useState(false)

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children)

      for (const item of scrollerContent) {
        const duplicatedItem = item.cloneNode(true)
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem)
        }
      }

      setStart(true)
    }
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty(
        "--animation-direction",
        direction === "left" ? "forwards" : "reverse"
      )
      const durationMap: Record<string, string> = {
        fast: "20s",
        normal: "40s",
        slow: "80s",
      }
      containerRef.current.style.setProperty(
        "--animation-duration",
        durationMap[speed] ?? "40s"
      )
    }
  }, [direction, speed])

  return (
    <div
      className={cn(
        "scroller mask-[linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] relative z-20 max-w-7xl overflow-hidden",
        className
      )}
      ref={containerRef}
    >
      <ul
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:paused"
        )}
        ref={scrollerRef}
      >
        {items.map((item) => (
          <li
            className="relative w-87.5 max-w-full shrink-0 rounded-2xl border border-zinc-200 border-b-0 bg-[linear-gradient(180deg,#fafafa,#f5f5f5)] px-8 py-6 md:w-112.5 dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a,#18181b)]"
            key={item.name}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none pointer-events-none absolute -top-0.5 -left-0.5 -z-1 h-[calc(100%+4px)] w-[calc(100%+4px)]"
              />
              <span className="relative z-20 font-normal text-neutral-800 text-sm leading-[1.6] dark:text-gray-100">
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className="font-normal text-neutral-500 text-sm leading-[1.6] dark:text-gray-400">
                    {item.name}
                  </span>
                  <span className="font-normal text-neutral-500 text-sm leading-[1.6] dark:text-gray-400">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  )
}

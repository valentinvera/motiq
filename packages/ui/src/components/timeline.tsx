"use client"
import { useInView } from "motion/react"
import type React from "react"
import { useRef } from "react"

export interface TimelineEntry {
  label: string
  title: string
  content: React.ReactNode
}

export function TimelineItem({ item }: { item: TimelineEntry }) {
  const itemRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(itemRef, { margin: "-40% 0px -40% 0px" })

  return (
    <div
      className="grid grid-cols-1 border-white/5 border-b last:border-b-0 md:grid-cols-12"
      ref={itemRef}
    >
      <div className="relative overflow-hidden border-white/5 border-b p-8 md:col-span-4 md:border-r md:border-b-0 md:p-12">
        <div
          className={`transition-opacity duration-500 ${isInView ? "opacity-100" : "opacity-20"}`}
        >
          <span className="mb-4 block font-mono text-[10px] text-lime-500 uppercase tracking-[0.2em]">
            {item.label}
          </span>
          <h3 className="font-bold text-3xl text-white uppercase leading-none tracking-tighter md:text-4xl">
            {item.title}
          </h3>
        </div>
        {isInView && (
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.02]" />
        )}
      </div>

      <div className="relative overflow-hidden bg-zinc-900/10 p-8 md:col-span-8 md:p-12">
        <div
          className={`transition-all delay-100 duration-700 ${isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          {item.content}
        </div>
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.01]" />
      </div>
    </div>
  )
}

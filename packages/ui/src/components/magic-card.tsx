"use client"
import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import type React from "react"
import { cn } from "../lib/utils"

export function MagicCard({
  children,
  className,
  gradientColor = "rgba(163, 230, 53, 0.15)", // Lime default
}: {
  children: React.ReactNode
  className?: string
  gradientColor?: string
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: mouse position tracked for radial gradient visual effect only
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50",
        className
      )}
      onMouseMove={handleMouseMove}
      role="presentation"
      tabIndex={-1}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${gradientColor},
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

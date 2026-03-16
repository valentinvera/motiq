import { motion } from "motion/react"
import { Navbar } from "./navbar"

export const Header = () => {
  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 top-0 z-50 border-white/5 border-b bg-zinc-950/50 backdrop-blur-xl"
      initial={{ y: -10, opacity: 0 }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Navbar />
      </div>
    </motion.header>
  )
}

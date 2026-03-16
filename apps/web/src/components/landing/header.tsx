import { Link } from "@tanstack/react-router"
import { motion } from "motion/react"
import { Navbar } from "./navbar"

export const Header = () => {
  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center border-white/5 border-b bg-black/50 backdrop-blur-xl"
      initial={{ y: -10, opacity: 0 }}
    >
      <div className="flex h-20 w-full max-w-7xl items-center px-6">
        <div className="flex flex-1 justify-start">
          <Link
            className="flex items-center gap-2 font-medium text-white text-xl tracking-tight"
            to="/"
          >
            <div className="flex size-5 items-center justify-center rounded bg-white">
              <div className="size-1 rounded-full bg-black" />
            </div>
            Motiq
          </Link>
        </div>

        <Navbar />

        {/*<div className="hidden flex-1 items-center justify-end gap-6 md:flex">
          <Link
            className="text-sm text-white/50 transition-colors hover:text-white"
            to="/login"
          >
            Log in
          </Link>
          <Link
            className="flex h-9 items-center rounded-full bg-white px-5 font-medium text-black text-sm transition-colors hover:bg-white/90"
            to="/join"
          >
            Get Access
          </Link>
        </div>*/}
      </div>
    </motion.header>
  )
}

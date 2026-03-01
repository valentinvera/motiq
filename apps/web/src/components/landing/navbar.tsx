import { Button } from "@motiq/ui/components/button"
import { motion } from "motion/react"
import { useState } from "react"

const links = [
  { name: "Features", href: "#features" },
  { name: "Workflow", href: "#how-it-works" },
  { name: "Ecosystem", href: "#integrations" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
]

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {links.map(({ href, name }) => (
          <a
            className="px-4 py-2 text-[13px] text-zinc-500 transition-all hover:text-white"
            href={href}
            key={name}
          >
            {name}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <Button
          className="hidden h-9 cursor-pointer rounded-sm bg-white px-5 text-[13px] text-zinc-950 transition-all hover:bg-lime-400 md:block"
          onClick={() => {
            const input = document.getElementById("waitlist-email")
            if (input) {
              input.focus({ preventScroll: true })
            }
          }}
        >
          Get Started
        </Button>
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className="group relative flex h-9 w-9 cursor-pointer items-center justify-center text-zinc-500 transition-colors hover:text-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
        >
          <div className="flex w-4 flex-col items-end gap-[5px]">
            <span
              className={`block h-[1.5px] bg-current transition-all duration-300 ${mobileMenuOpen ? "w-4 translate-y-[6.5px] rotate-45" : "w-4"}`}
            />
            <span
              className={`block h-[1.5px] bg-current transition-all duration-300 ${mobileMenuOpen ? "w-0 opacity-0" : "w-2.5 group-hover:w-4"}`}
            />
            <span
              className={`block h-[1.5px] bg-current transition-all duration-300 ${mobileMenuOpen ? "w-4 -translate-y-[6.5px] -rotate-45" : "w-3.5 group-hover:w-4"}`}
            />
          </div>
        </button>
      </div>
      {mobileMenuOpen && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 top-full border-white/5 border-b bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl md:hidden"
          initial={{ opacity: 0, y: -10 }}
        >
          <nav className="flex flex-col gap-4">
            {links
              .filter(({ name }) => name !== "FAQ")
              .map((item) => (
                <a
                  className="font-bold text-lg text-zinc-400 hover:text-lime-400"
                  href={item.href}
                  key={item.name}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            <hr className="my-2 border-white/5" />
            <Button
              className="h-12 w-full cursor-pointer rounded-sm bg-white font-bold text-zinc-950 hover:bg-lime-400"
              onClick={() => {
                setMobileMenuOpen(false)
                const input = document.getElementById("waitlist-email")
                if (input) {
                  input.scrollIntoView({ behavior: "smooth", block: "center" })
                  setTimeout(() => input.focus(), 500)
                }
              }}
            >
              Get Started
            </Button>
          </nav>
        </motion.div>
      )}
    </>
  )
}

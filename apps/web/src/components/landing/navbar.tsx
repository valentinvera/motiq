import { Button } from "@motiq/ui/components/button"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

const links = [
  { name: "Features", href: "#features" },
  { name: "Workflow", href: "#how-it-works" },
  { name: "Integrations", href: "#integrations" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
]

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  return (
    <>
      <nav className="hidden items-center gap-2 md:flex">
        {links.map(({ href, name }) => (
          <a
            className="px-4 py-1.5 font-medium text-white/50 text-xs transition-colors hover:text-white"
            href={href}
            key={name}
          >
            {name}
          </a>
        ))}
      </nav>

      {/* Mobile Toggle */}
      <button
        aria-expanded={mobileMenuOpen}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 cursor-pointer items-center justify-center text-white/50 transition-colors hover:text-white md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        type="button"
      >
        <div className="flex w-5 flex-col items-center gap-[4px]">
          <span
            className={`block h-[1.5px] bg-current transition-all duration-300 ${mobileMenuOpen ? "w-5 translate-y-[5.5px] rotate-45" : "w-5 rounded-full"}`}
          />
          <span
            className={`block h-[1.5px] bg-current transition-all duration-300 ${mobileMenuOpen ? "w-0 opacity-0" : "w-5 rounded-full"}`}
          />
          <span
            className={`block h-[1.5px] bg-current transition-all duration-300 ${mobileMenuOpen ? "w-5 -translate-y-[5.5px] -rotate-45" : "w-5 rounded-full"}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-4 top-20 z-50 rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl md:hidden"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: -10 }}
          >
            <nav className="flex flex-col gap-4">
              {links.map((item) => (
                <a
                  className="font-medium text-white/70 text-xl transition-colors hover:text-white"
                  href={item.href}
                  key={item.name}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <hr className="my-2 border-white/5" />
              {/*<div className="flex flex-col gap-3">
                <button className="h-12 w-full rounded-xl bg-white font-medium text-black">
                  Get Access
                </button>
                <button className="h-12 w-full rounded-xl border border-white/10 font-medium text-white">
                  Log in
                </button>
              </div>*/}
              <Button
                className="h-12 w-full cursor-pointer rounded-sm bg-white font-bold text-zinc-950 hover:bg-lime-400"
                onClick={() => {
                  setMobileMenuOpen(false)
                  const input = document.getElementById("waitlist-email")
                  if (input) {
                    input.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    })
                    setTimeout(() => input.focus(), 500)
                  }
                }}
              >
                Get Started
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

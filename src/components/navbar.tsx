import { Menu, X } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Logo } from "./logo"
import { ModeToggle } from "./mode-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const menuItems = [
  { name: "Features", href: "features" },
  { name: "Templates", href: "templates" },
  { name: "Pricing", href: "pricing" },
  { name: "Blog", href: "blog" },
]

export const Navbar = () => {
  const [menuState, setMenuState] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav data-state={menuState && "active"} className="fixed z-20 w-full px-2">
      <div
        className={cn(
          "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
          isScrolled && "max-w-4xl rounded-2xl border bg-background/50 backdrop-blur-lg lg:px-5",
        )}
      >
        <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
          <div className="flex w-full justify-between lg:w-auto">
            <Link to="." aria-label="home" className="flex items-center space-x-2">
              <Logo />
            </Link>

            <div className="flex items-center gap-2 lg:hidden">
              <ModeToggle />
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 block cursor-pointer p-2.5"
              >
                <Menu className="m-auto size-6 duration-200 in-data-[state=active]:scale-0 in-data-[state=active]:rotate-180 in-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 scale-0 -rotate-180 opacity-0 duration-200 in-data-[state=active]:scale-100 in-data-[state=active]:rotate-0 in-data-[state=active]:opacity-100" />
              </button>
            </div>
          </div>

          <div className="absolute inset-0 m-auto hidden size-fit lg:block">
            <ul className="flex gap-8 text-sm">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.href}
                    className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                  >
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border bg-background p-6 shadow-2xl shadow-zinc-300/20 in-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:in-data-[state=active]:flex dark:shadow-none dark:lg:bg-transparent">
            <div className="lg:hidden">
              <ul className="space-y-6 text-base">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      to={item.href}
                      className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden lg:block">
              <ModeToggle />
            </div>
            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
              <Button
                className="cursor-pointer"
                size="sm"
                onClick={() => {
                  document
                    .getElementById("waitlist")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })

                  setMenuState(false)
                }}
              >
                <span>Get Started</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

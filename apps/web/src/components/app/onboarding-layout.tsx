import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@motiq/ui/components/avatar"
import { Button } from "@motiq/ui/components/button"
import { Link, type LinkProps } from "@tanstack/react-router"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { getMediaUrl } from "@/lib/media"

function MotiqIcon() {
  return (
    <Link aria-label="Motiq home" className="group inline-flex" to="/">
      <div className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-black transition-colors group-hover:border-white/20">
        <svg
          className="h-5 w-5 text-white transition-colors group-hover:text-zinc-300"
          viewBox="250 250 524 524"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Motiq</title>
          <path
            d="M469.123596,676.897461 C463.831482,671.561035 458.676392,666.576782 453.829468,661.309021 C451.538391,658.819092 449.111969,658.065735 445.864014,658.431396 C390.924194,664.615051 340.442688,629.341919 328.184509,575.925781 C320.170563,541.004211 327.274261,508.608612 345.514099,478.226807 C354.174561,463.801239 364.851837,451.129120 377.741516,440.354034 C380.792267,437.803741 381.045959,435.062866 380.196869,431.482147 C374.982819,409.493530 375.983307,387.842499 384.839661,366.915009 C399.471680,332.339569 424.925201,309.878418 461.725098,301.964539 C495.674622,294.663635 527.078857,302.890167 556.070557,321.275238 C568.392334,329.089081 579.290894,338.581696 588.654114,349.786163 C590.551819,352.057068 592.676941,352.856598 595.644409,352.529083 C655.779724,345.891449 707.586304,386.355286 715.093018,446.196136 C719.637390,482.421387 708.299133,514.500366 687.908691,543.905579 C681.133789,553.675659 673.094910,562.335083 663.954163,569.938293 C661.306824,572.140320 660.183228,574.245728 661.047607,578.052612 C667.259277,605.410156 664.252625,631.719238 650.536377,656.366577 C632.382019,688.988953 604.377808,707.135193 567.410522,711.367004 C536.981018,714.850464 509.973206,705.322449 484.878876,688.933044 C479.425964,685.371704 474.306854,681.386963 469.123596,676.897461 M481.487946,504.907715 C480.597900,508.072571 477.748474,511.110138 481.398743,514.442139 C493.026550,525.056152 505.708038,534.078491 520.071777,540.648743 C524.061218,542.473633 527.289673,542.051880 530.189636,538.414551 C539.903442,526.231079 547.883240,513.070679 553.666077,498.568695 C555.101868,494.968079 554.666260,492.269165 551.690552,489.715057 C539.281799,479.064392 525.404968,471.134155 509.725189,466.335114 C506.300110,465.286804 504.219727,466.296906 502.024841,468.891327 C493.104156,479.435547 486.372955,491.189667 481.487946,504.907715 M517.183411,405.064514 C528.658875,408.640350 539.810669,412.944855 550.009827,419.447113 C551.211670,420.213318 552.668030,421.403473 554.089905,420.118744 C555.421082,418.915955 554.777893,417.276276 554.105896,415.947693 C551.702820,411.196381 549.451599,406.342712 546.693054,401.800995 C531.069519,376.078369 508.944336,362.076721 478.038544,364.288025 C458.316986,365.699127 440.177185,380.287292 434.859528,399.074738 C434.221619,401.328552 432.398743,404.053253 434.521027,406.098175 C436.422394,407.930176 438.976105,406.307922 441.145966,405.681824 C466.159424,398.464172 491.228790,397.279297 517.183411,405.064514 M558.288330,645.686462 C576.848083,645.274536 599.549500,632.022461 605.585999,611.617859 C606.195679,609.557129 607.617859,607.400696 606.069641,605.466187 C604.270752,603.218506 601.822998,604.516846 599.591614,605.093811 C579.549316,610.275818 559.318176,611.945862 538.803284,608.336426 C521.401611,605.274780 505.189636,599.033875 489.922241,590.207092 C488.435303,589.347351 486.742737,587.463562 484.997864,588.937622 C483.069275,590.566895 484.631287,592.632629 485.350555,594.425598 C487.405823,599.548523 490.102112,604.366150 493.198364,608.892273 C508.638489,631.462830 528.793274,645.943787 558.288330,645.686462 M644.003479,508.506287 C648.803711,501.238922 652.372559,493.390594 655.091614,485.132812 C660.868408,467.589081 660.403137,450.440308 651.676697,433.898407 C646.624695,424.321625 639.225037,417.107666 629.200867,412.785706 C625.466553,411.175690 623.872192,412.392731 624.230591,416.460480 C624.317078,417.443024 624.655090,418.402679 624.867798,419.374939 C629.625183,441.121826 632.019714,462.934082 627.354919,485.064301 C623.863953,501.625610 617.879028,517.227905 610.098755,532.201477 C609.023010,534.271790 607.086792,536.337708 609.336914,539.398682 C624.067749,532.892639 634.407349,521.656555 644.003479,508.506287 M412.513611,537.146179 C412.729675,534.663208 412.777191,532.151978 413.188934,529.701904 C416.022095,512.842957 421.171936,496.756348 429.334381,481.678070 C430.307526,479.880371 431.905609,478.081757 430.343597,475.394287 C425.345459,476.061676 421.745392,479.346558 418.061127,482.265686 C394.643250,500.820007 380.356689,524.069885 383.456451,554.951660 C385.299072,573.309448 394.234772,587.987610 411.131378,596.869263 C412.935547,597.817627 415.039642,599.843628 417.033020,598.051270 C418.869568,596.399902 417.484741,594.008606 416.992737,591.941956 C412.771698,574.210449 410.178009,556.337219 412.513611,537.146179 z"
            fill="currentColor"
          />
        </svg>
      </div>
    </Link>
  )
}

export interface OnboardingUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  description,
  preview,
  children,
  previousSlot,
  skipSlot,
  nextSlot,
  user,
}: {
  step: number
  totalSteps: number
  title: string
  description: string
  preview: ReactNode
  children: ReactNode
  previousSlot?: ReactNode
  skipSlot?: ReactNode
  nextSlot?: ReactNode
  user?: OnboardingUser | null
}) {
  const reduceMotion = useReducedMotion()
  const progress = Math.min(100, Math.max(0, (step / totalSteps) * 100))
  const initial =
    user?.name?.trim()?.[0]?.toUpperCase() ??
    user?.email?.trim()?.[0]?.toUpperCase() ??
    "?"
  const userImageUrl = getMediaUrl(user?.image)

  return (
    <div className="relative flex min-h-dvh flex-col bg-black text-white selection:bg-white/20 selection:text-white">
      <header className="relative z-20 flex items-center gap-4 border-white/[0.04] border-b px-6 py-4 lg:gap-6 lg:px-10">
        <MotiqIcon />

        <div className="flex flex-1 items-center gap-3">
          <div className="relative h-px flex-1 overflow-hidden bg-white/[0.06]">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="absolute inset-y-0 left-0 bg-white"
              initial={reduceMotion ? false : { width: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="font-medium text-[11px] text-zinc-500 tabular-nums">
            {step} / {totalSteps}
          </span>
        </div>

        {user ? (
          <Avatar className="size-8 border border-white/10">
            <AvatarImage
              alt={user.name ?? user.email ?? ""}
              src={userImageUrl}
            />
            <AvatarFallback className="bg-zinc-900 text-xs text-zinc-300">
              {initial}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="relative hidden overflow-hidden border-white/[0.04] border-r lg:flex lg:w-1/2">
          <div className="absolute inset-0 bg-black" />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(
                circle at 60% 45%,
                rgba(180, 180, 180, 0.18) 0%,
                rgba(80, 80, 80, 0.14) 28%,
                rgba(20, 20, 20, 0.6) 60%,
                rgba(0, 0, 0, 0.98) 92%
              )`,
            }}
          />
          <div className="absolute inset-0 bg-grain opacity-[0.08]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.6)_100%)]" />

          <div className="relative z-10 flex w-full items-center justify-center p-12 xl:p-16">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              key={step}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {preview}
            </motion.div>
          </div>
        </aside>

        <main className="relative flex w-full flex-1 flex-col lg:w-1/2">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 88% 92%, rgba(63,63,70,0.06) 0%, transparent 34%)",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 lg:px-12 lg:py-14">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[420px] space-y-8"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              key={`form-${step}`}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.05,
              }}
            >
              <div className="space-y-2">
                <h1 className="font-medium text-2xl text-zinc-100 tracking-tight">
                  {title}
                </h1>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {description}
                </p>
              </div>
              {children}
              {previousSlot || skipSlot || nextSlot ? (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center">{previousSlot}</div>
                  <div className="flex items-center gap-1">
                    {skipSlot}
                    {nextSlot}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function OnboardingPreviousLink({
  to,
  label = "Previous",
}: {
  to: LinkProps["to"]
  label?: string
}) {
  return (
    <Link
      className="group inline-flex h-9 items-center gap-1.5 rounded-md px-3 font-medium text-sm text-zinc-500 transition-colors hover:text-zinc-200"
      to={to}
    >
      <ArrowLeftIcon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </Link>
  )
}

export function OnboardingSkipLink({
  to,
  label = "Skip",
}: {
  to: LinkProps["to"]
  label?: string
}) {
  return (
    <Link
      className="inline-flex h-9 items-center rounded-md px-3 font-medium text-sm text-zinc-500 transition-colors hover:text-zinc-200"
      to={to}
    >
      {label}
    </Link>
  )
}

export function OnboardingNextButton({
  label = "Continue",
  loadingLabel = "Saving...",
  loading,
  disabled,
  onClick,
  type = "button",
  form,
}: {
  label?: string
  loadingLabel?: string
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"]
  form?: string
}) {
  return (
    <Button
      className="group inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-white px-4 font-medium text-black text-sm transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || loading}
      form={form}
      onClick={onClick}
      type={type}
    >
      {loading ? loadingLabel : label}
      {!loading && (
        <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      )}
    </Button>
  )
}

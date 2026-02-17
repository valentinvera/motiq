import { IntercomIcon } from "@motiq/ui/icons/intercom"
import { JiraIcon } from "@motiq/ui/icons/jira"
import { LinearIcon } from "@motiq/ui/icons/linear"
import { NotionIcon } from "@motiq/ui/icons/notion"
import { PolarIcon } from "@motiq/ui/icons/polar"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { ZapierIcon } from "@motiq/ui/icons/zapier"
import { motion } from "motion/react"

const integrations = [
  { icon: SlackIcon, name: "Slack", color: "bg-fuchsia-500/20" },
  { icon: NotionIcon, name: "Notion", color: "bg-zinc-500/20" },
  { icon: LinearIcon, name: "Linear", color: "bg-purple-500/20" },
  { icon: JiraIcon, name: "Jira", color: "bg-blue-500/20" },
  { icon: ZapierIcon, name: "Zapier", color: "bg-orange-500/20" },
  { icon: IntercomIcon, name: "Intercom", color: "bg-blue-600/20" },
  { icon: PolarIcon, name: "Polar", color: "bg-indigo-500/20" },
]

export const IntegrationsOrbit = () => {
  return (
    <div className="relative flex items-center justify-center py-12">
      <div className="mask-[radial-gradient(ellipse_at_center,black,transparent_75%)] absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-size-[24px_24px] opacity-20" />
      </div>

      <div className="absolute size-60 rounded-full border border-white/5" />
      <div className="absolute size-90 rounded-full border border-white/5" />
      <div className="absolute size-120 rounded-full border border-white/3" />

      <div className="relative z-10">
        <div className="absolute -inset-4 animate-pulse rounded-2xl bg-lime-400/20 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-lime-300 bg-lime-400 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
          <svg
            className="h-12 w-12 text-zinc-950"
            fill="currentColor"
            preserveAspectRatio="none"
            viewBox="250 250 524 524"
          >
            <title>Motiq</title>
            <path d="M469.123596,676.897461 C463.831482,671.561035 458.676392,666.576782 453.829468,661.309021 C451.538391,658.819092 449.111969,658.065735 445.864014,658.431396 C390.924194,664.615051 340.442688,629.341919 328.184509,575.925781 C320.170563,541.004211 327.274261,508.608612 345.514099,478.226807 C354.174561,463.801239 364.851837,451.129120 377.741516,440.354034 C380.792267,437.803741 381.045959,435.062866 380.196869,431.482147 C374.982819,409.493530 375.983307,387.842499 384.839661,366.915009 C399.471680,332.339569 424.925201,309.878418 461.725098,301.964539 C495.674622,294.663635 527.078857,302.890167 556.070557,321.275238 C568.392334,329.089081 579.290894,338.581696 588.654114,349.786163 C590.551819,352.057068 592.676941,352.856598 595.644409,352.529083 C655.779724,345.891449 707.586304,386.355286 715.093018,446.196136 C719.637390,482.421387 708.299133,514.500366 687.908691,543.905579 C681.133789,553.675659 673.094910,562.335083 663.954163,569.938293 C661.306824,572.140320 660.183228,574.245728 661.047607,578.052612 C667.259277,605.410156 664.252625,631.719238 650.536377,656.366577 C632.382019,688.988953 604.377808,707.135193 567.410522,711.367004 C536.981018,714.850464 509.973206,705.322449 484.878876,688.933044 C479.425964,685.371704 474.306854,681.386963 469.123596,676.897461 M481.487946,504.907715 C480.597900,508.072571 477.748474,511.110138 481.398743,514.442139 C493.026550,525.056152 505.708038,534.078491 520.071777,540.648743 C524.061218,542.473633 527.289673,542.051880 530.189636,538.414551 C539.903442,526.231079 547.883240,513.070679 553.666077,498.568695 C555.101868,494.968079 554.666260,492.269165 551.690552,489.715057 C539.281799,479.064392 525.404968,471.134155 509.725189,466.335114 C506.300110,465.286804 504.219727,466.296906 502.024841,468.891327 C493.104156,479.435547 486.372955,491.189667 481.487946,504.907715 M517.183411,405.064514 C528.658875,408.640350 539.810669,412.944855 550.009827,419.447113 C551.211670,420.213318 552.668030,421.403473 554.089905,420.118744 C555.421082,418.915955 554.777893,417.276276 554.105896,415.947693 C551.702820,411.196381 549.451599,406.342712 546.693054,401.800995 C531.069519,376.078369 508.944336,362.076721 478.038544,364.288025 C458.316986,365.699127 440.177185,380.287292 434.859528,399.074738 C434.221619,401.328552 432.398743,404.053253 434.521027,406.098175 C436.422394,407.930176 438.976105,406.307922 441.145966,405.681824 C466.159424,398.464172 491.228790,397.279297 517.183411,405.064514 M558.288330,645.686462 C576.848083,645.274536 599.549500,632.022461 605.585999,611.617859 C606.195679,609.557129 607.617859,607.400696 606.069641,605.466187 C604.270752,603.218506 601.822998,604.516846 599.591614,605.093811 C579.549316,610.275818 559.318176,611.945862 538.803284,608.336426 C521.401611,605.274780 505.189636,599.033875 489.922241,590.207092 C488.435303,589.347351 486.742737,587.463562 484.997864,588.937622 C483.069275,590.566895 484.631287,592.632629 485.350555,594.425598 C487.405823,599.548523 490.102112,604.366150 493.198364,608.892273 C508.638489,631.462830 528.793274,645.943787 558.288330,645.686462 M644.003479,508.506287 C648.803711,501.238922 652.372559,493.390594 655.091614,485.132812 C660.868408,467.589081 660.403137,450.440308 651.676697,433.898407 C646.624695,424.321625 639.225037,417.107666 629.200867,412.785706 C625.466553,411.175690 623.872192,412.392731 624.230591,416.460480 C624.317078,417.443024 624.655090,418.402679 624.867798,419.374939 C629.625183,441.121826 632.019714,462.934082 627.354919,485.064301 C623.863953,501.625610 617.879028,517.227905 610.098755,532.201477 C609.023010,534.271790 607.086792,536.337708 609.336914,539.398682 C624.067749,532.892639 634.407349,521.656555 644.003479,508.506287 M412.513611,537.146179 C412.729675,534.663208 412.777191,532.151978 413.188934,529.701904 C416.022095,512.842957 421.171936,496.756348 429.334381,481.678070 C430.307526,479.880371 431.905609,478.081757 430.343597,475.394287 C425.345459,476.061676 421.745392,479.346558 418.061127,482.265686 C394.643250,500.820007 380.356689,524.069885 383.456451,554.951660 C385.299072,573.309448 394.234772,587.987610 411.131378,596.869263 C412.935547,597.817627 415.039642,599.843628 417.033020,598.051270 C418.869568,596.399902 417.484741,594.008606 416.992737,591.941956 C412.771698,574.210449 410.178009,556.337219 412.513611,537.146179 z" />
          </svg>
        </div>
      </div>

      <div
        className="absolute size-60 motion-safe:animate-spin"
        style={{ animationDuration: "35s" }}
      >
        {integrations.slice(0, 4).map((item, index) => {
          const angle = index * 90 * (Math.PI / 180)
          const x = Math.cos(angle) * 120
          const y = Math.sin(angle) * 120
          return (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0 }}
              key={item.name}
              style={{ x, y }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-md motion-safe:animate-spin`}
                style={{
                  animationDuration: "35s",
                  animationDirection: "reverse",
                }}
              >
                <item.icon className="h-6 w-6" />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div
        className="absolute size-90 motion-safe:animate-spin"
        style={{ animationDuration: "50s", animationDirection: "reverse" }}
      >
        {integrations.slice(4).map((item, index) => {
          const angle = (index * 90 + 45) * (Math.PI / 180)
          const x = Math.cos(angle) * 180
          const y = Math.sin(angle) * 180
          return (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0 }}
              key={item.name}
              style={{ x, y }}
              transition={{ delay: index * 0.1 + 0.5 }}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} border border-white/10 bg-zinc-900/50 shadow-lg backdrop-blur-md motion-safe:animate-spin`}
                style={{ animationDuration: "50s" }}
              >
                <item.icon className="h-6 w-6" />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="pointer-events-none absolute size-125">
        <svg className="h-full w-full" viewBox="0 0 400 400">
          <title>Connection lines</title>
          <defs>
            <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="rgb(163, 230, 53)" stopOpacity="0" />
              <stop
                offset="50%"
                stopColor="rgb(163, 230, 53)"
                stopOpacity="0.15"
              />
              <stop
                offset="100%"
                stopColor="rgb(163, 230, 53)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {[0, 90, 180, 270].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 200 200)`}>
              <line
                stroke="url(#lineGradient)"
                strokeWidth="1"
                x1="200"
                x2="320"
                y1="200"
                y2="200"
              />
              <motion.circle
                animate={{ cx: 200, cy: 200, opacity: [0, 1, 0] }}
                fill="rgb(163, 230, 53)"
                initial={{ cx: 320, cy: 200, opacity: 0 }}
                r="1.5"
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                  delay: angle / 90,
                }}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

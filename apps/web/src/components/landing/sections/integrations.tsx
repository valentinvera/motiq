import { DiscordIcon } from "@motiq/ui/icons/discord"
import { GithubIcon } from "@motiq/ui/icons/github"
import { JiraIcon } from "@motiq/ui/icons/jira"
import { LinearIcon } from "@motiq/ui/icons/linear"
import { NotionIcon } from "@motiq/ui/icons/notion"
import { SlackIcon } from "@motiq/ui/icons/slack"
import { TelegramIcon } from "@motiq/ui/icons/telegram"
import { ZendeskIcon } from "@motiq/ui/icons/zendesk"
import { motion } from "motion/react"

export const Integrations = () => {
  const integrations = [
    { name: "Telegram", icon: TelegramIcon, desc: "Monitor groups" },
    { name: "Slack", icon: SlackIcon, desc: "Monitor #channels" },
    { name: "Linear", icon: LinearIcon, desc: "Create issues" },
    { name: "Jira", icon: JiraIcon, desc: "Track bugs" },
    {
      name: "Discord",
      icon: DiscordIcon,
      desc: "Community sentiment",
      color: "text-[#5865F2]",
    },
    { name: "Notion", icon: NotionIcon, desc: "Document insights" },
    {
      name: "GitHub",
      icon: GithubIcon,
      desc: "Link to PRs",
      color: "text-white",
    },
    {
      name: "Zendesk",
      icon: ZendeskIcon,
      desc: "Analyze tickets",
      color: "text-white",
    },
  ]

  return (
    <section
      className="relative border-white/5 border-y bg-black py-32"
      id="ecosystem"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-24 max-w-2xl text-center">
          <span className="mb-6 inline-block rounded-full border border-white/10 px-3 py-1 font-medium text-[10px] text-white/60 uppercase tracking-widest">
            Ecosystem
          </span>
          <h2 className="mb-6 font-medium text-4xl text-white leading-tight tracking-tighter md:text-5xl lg:text-6xl">
            Universal <span className="text-white/40">Intake.</span>
          </h2>
          <p className="text-lg text-white/50 leading-relaxed">
            Connect to your entire support and feedback stack. Deploy agents to
            your existing channels in one click.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {integrations.map((item, i) => (
            <motion.div
              className="group relative rounded-3xl border border-white/5 bg-white/2 p-6 transition-all hover:bg-white/5"
              initial={{ opacity: 0, y: 20 }}
              key={item.name}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <item.icon
                className={`mb-6 size-8 transition-colors ${"color" in item ? item.color : "text-white/40 group-hover:text-white"}`}
              />
              <h3 className="mb-1 font-medium text-white">{item.name}</h3>
              <span className="text-[11px] text-white/40">{item.desc}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <div className="inline-flex items-center gap-4 rounded-full border border-white/5 bg-white/2 px-6 py-3">
            <div className="size-2 animate-pulse rounded-full bg-white" />
            <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
              + 50 adapters in development
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Column, Hr, Row, Section, Text } from "@react-email/components"
import {
  MailButton,
  MailNote,
  MailShell,
  MailText,
  SignalPanel,
} from "./_components"

interface TopItem {
  label: string
  count: number
  percentage: number
}

interface RepeatedCustomer {
  name: string
  count: number
  company?: string | null
  email?: string | null
}

interface WeeklyAnalysisEmailProps {
  organizationName: string
  dateRange: string
  totalSignals: number
  totalAlerts: number
  criticalAlerts: number
  topSignalSource?: TopItem | null
  topSignalChannel?: TopItem | null
  topAlertSource?: TopItem | null
  topAlertChannel?: TopItem | null
  topSignalType?: TopItem | null
  topAlertType?: TopItem | null
  repeatedThemes: string[]
  repeatedCustomers: RepeatedCustomer[]
  customerConcentration: string
  recommendations: string[]
  overviewUrl: string
  alertsUrl: string
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string | number
  tone?: "default" | "critical"
}) {
  const valueClass =
    tone === "critical"
      ? "m-0 font-semibold text-[#fca5a5] text-[24px] leading-[30px]"
      : "m-0 font-semibold text-[24px] text-white leading-[30px]"

  return (
    <Column className="w-1/3 pr-2">
      <Section className="rounded-xl border border-[#27272a] border-solid bg-[#111113] px-4 py-3">
        <Text className={valueClass}>{value}</Text>
        <Text className="m-0 mt-1 text-[#71717a] text-[11px] uppercase tracking-[0.12em]">
          {label}
        </Text>
      </Section>
    </Column>
  )
}

function TopItemRow({
  label,
  title,
  item,
}: {
  label: string
  title: string
  item?: TopItem | null
}) {
  return (
    <Row className="mb-3">
      <Column>
        <Text className="m-0 text-[#71717a] text-[12px]">{label}</Text>
        <Text className="m-0 mt-1 font-medium text-[#f4f4f5] text-[14px]">
          {item ? item.label : "No data"}
        </Text>
      </Column>
      <Column className="w-[92px] text-right">
        <Text className="m-0 font-semibold text-[#d4d4d8] text-[13px]">
          {item ? `${item.count} (${item.percentage}%)` : "-"}
        </Text>
        <Text className="m-0 mt-1 text-[#52525b] text-[10px] uppercase tracking-[0.12em]">
          {title}
        </Text>
      </Column>
    </Row>
  )
}

export function WeeklyAnalysisEmail({
  organizationName = "Your Workspace",
  dateRange = "Last 7 days",
  totalSignals = 0,
  totalAlerts = 0,
  criticalAlerts = 0,
  topSignalSource = null,
  topSignalChannel = null,
  topAlertSource = null,
  topAlertChannel = null,
  topSignalType = null,
  topAlertType = null,
  repeatedThemes = [],
  repeatedCustomers = [],
  customerConcentration = "No customer concentration detected this week.",
  recommendations = [],
  overviewUrl = "https://app.motiq.app/overview",
  alertsUrl = "https://app.motiq.app/alerts",
}: WeeklyAnalysisEmailProps) {
  return (
    <MailShell
      eyebrow={`${organizationName} / ${dateRange}`}
      preview={`Weekly analysis: ${totalSignals} signals and ${totalAlerts} alerts`}
      title="Weekly customer intelligence report"
    >
      <MailText>
        Motiq reviewed your customer signals and alerts from the last week to
        surface repeated patterns, high-friction channels, and accounts that may
        need attention.
      </MailText>

      <Row className="mb-5">
        <Metric label="Signals" value={totalSignals} />
        <Metric label="Alerts" value={totalAlerts} />
        <Metric label="Critical" tone="critical" value={criticalAlerts} />
      </Row>

      <SignalPanel>
        <Text className="m-0 mb-4 font-semibold text-[#71717a] text-[13px] uppercase tracking-[0.14em]">
          Sources and channels
        </Text>
        <TopItemRow
          item={topSignalSource}
          label="Most signal volume from"
          title="signals"
        />
        <TopItemRow
          item={topSignalChannel}
          label="Most active signal channel"
          title="signals"
        />
        <Hr className="my-3 border-[#27272a]" />
        <TopItemRow
          item={topAlertSource}
          label="Most alert volume from"
          title="alerts"
        />
        <TopItemRow
          item={topAlertChannel}
          label="Most active alert channel"
          title="alerts"
        />
      </SignalPanel>

      <SignalPanel>
        <Text className="m-0 mb-4 font-semibold text-[#71717a] text-[13px] uppercase tracking-[0.14em]">
          Repeated patterns
        </Text>
        <TopItemRow
          item={topSignalType}
          label="Most common signal type"
          title="signals"
        />
        <TopItemRow
          item={topAlertType}
          label="Most common alert type"
          title="alerts"
        />
        {repeatedThemes.length > 0 ? (
          <Section className="mt-3">
            {repeatedThemes.map((theme) => (
              <Text
                className="m-0 mb-2 rounded-lg border border-[#27272a] border-solid bg-[#18181b] px-3 py-2 text-[#d4d4d8] text-[13px]"
                key={theme}
              >
                {theme}
              </Text>
            ))}
          </Section>
        ) : (
          <Text className="m-0 mt-2 text-[#71717a] text-[13px]">
            No strong repeated keywords were detected in this window.
          </Text>
        )}
      </SignalPanel>

      <SignalPanel>
        <Text className="m-0 mb-3 font-semibold text-[#71717a] text-[13px] uppercase tracking-[0.14em]">
          Customer concentration
        </Text>
        <Text className="m-0 mb-4 text-[#d4d4d8] text-[14px] leading-[22px]">
          {customerConcentration}
        </Text>
        {repeatedCustomers.length > 0 ? (
          repeatedCustomers.map((customer) => (
            <Row className="mb-3" key={`${customer.name}-${customer.email}`}>
              <Column>
                <Text className="m-0 font-medium text-[14px] text-white">
                  {customer.name}
                </Text>
                <Text className="m-0 mt-1 text-[#71717a] text-[12px]">
                  {customer.company || customer.email || "Customer"}
                </Text>
              </Column>
              <Column className="w-[70px] text-right">
                <Text className="m-0 font-semibold text-[#d4d4d8] text-[13px]">
                  {customer.count}
                </Text>
                <Text className="m-0 mt-1 text-[#52525b] text-[10px] uppercase tracking-[0.12em]">
                  signals
                </Text>
              </Column>
            </Row>
          ))
        ) : (
          <Text className="m-0 text-[#71717a] text-[13px]">
            No repeated customer accounts were detected this week.
          </Text>
        )}
      </SignalPanel>

      <MailNote>
        {recommendations.length > 0
          ? recommendations.join(" ")
          : "Keep monitoring new signals and review high-priority alerts as they appear."}
      </MailNote>

      <Hr className="my-6 border-[#27272a]" />
      <Row>
        <Column className="pr-2">
          <MailButton href={overviewUrl}>Open overview</MailButton>
        </Column>
        <Column>
          <MailButton href={alertsUrl}>Review alerts</MailButton>
        </Column>
      </Row>
    </MailShell>
  )
}

export default WeeklyAnalysisEmail

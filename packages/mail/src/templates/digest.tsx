import { Column, Hr, Row, Text } from "@react-email/components"
import {
  MailButton,
  MailNote,
  MailShell,
  MailText,
  SignalPanel,
} from "./_components"

interface SignalSummary {
  type: string
  count: number
}

interface AlertSummary {
  title: string
  severity: string
  type: string
}

interface DigestEmailProps {
  organizationName: string
  date: string
  totalSignals: number
  signalsByType: SignalSummary[]
  criticalAlerts: AlertSummary[]
  unacknowledgedCount: number
  overviewUrl: string
}

function SeverityPill({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase()
  const className =
    normalized === "critical"
      ? "m-0 rounded-full border border-solid border-[#7f1d1d] bg-[#450a0a] px-2 py-1 font-semibold text-[10px] text-[#fca5a5] uppercase tracking-[0.12em]"
      : "m-0 rounded-full border border-solid border-[#3f3f46] bg-[#18181b] px-2 py-1 font-semibold text-[10px] text-[#d4d4d8] uppercase tracking-[0.12em]"

  return <Text className={className}>{severity}</Text>
}

export function DigestEmail({
  organizationName = "Your Workspace",
  date = new Date().toLocaleDateString(),
  totalSignals = 0,
  signalsByType = [],
  criticalAlerts = [],
  unacknowledgedCount = 0,
  overviewUrl = "https://app.motiq.app/overview",
}: DigestEmailProps) {
  return (
    <MailShell
      eyebrow={`${organizationName} / ${date}`}
      preview={`Motiq Daily Digest - ${totalSignals} signals, ${unacknowledgedCount} alerts`}
      title="Daily signal digest"
    >
      <MailText>
        Motiq monitored your connected sources and found{" "}
        <strong className="text-white">{totalSignals}</strong> new customer
        signal{totalSignals === 1 ? "" : "s"} in the last 24 hours.
      </MailText>

      <SignalPanel>
        <Text className="m-0 mb-3 font-semibold text-[#71717a] text-[13px] uppercase tracking-[0.14em]">
          Signal mix
        </Text>
        {signalsByType.length > 0 ? (
          signalsByType.map((item) => (
            <Row className="mb-2" key={item.type}>
              <Column>
                <Text className="m-0 text-[#d4d4d8] text-[14px]">
                  {item.type}
                </Text>
              </Column>
              <Column className="w-[60px] text-right">
                <Text className="m-0 font-semibold text-[14px] text-white">
                  {item.count}
                </Text>
              </Column>
            </Row>
          ))
        ) : (
          <Text className="m-0 text-[#71717a] text-[14px]">
            No categorized signals in this window.
          </Text>
        )}
      </SignalPanel>

      {criticalAlerts.length > 0 ? (
        <SignalPanel>
          <Text className="m-0 mb-3 font-semibold text-[#fca5a5] text-[13px] uppercase tracking-[0.14em]">
            Alerts requiring attention
          </Text>
          {criticalAlerts.map((alertItem, index) => (
            <Row className="mb-3" key={`${alertItem.title}-${index}`}>
              <Column>
                <Text className="m-0 font-medium text-[14px] text-white leading-[21px]">
                  {alertItem.title}
                </Text>
                <Text className="m-0 mt-1 text-[#71717a] text-[12px]">
                  {alertItem.type}
                </Text>
              </Column>
              <Column className="w-[92px] text-right">
                <SeverityPill severity={alertItem.severity} />
              </Column>
            </Row>
          ))}
        </SignalPanel>
      ) : null}

      {unacknowledgedCount > 0 ? (
        <MailNote>
          You have {unacknowledgedCount} unresolved alert
          {unacknowledgedCount === 1 ? "" : "s"} waiting for review.
        </MailNote>
      ) : null}

      <Hr className="my-6 border-[#27272a]" />
      <MailButton href={overviewUrl}>Open overview</MailButton>
    </MailShell>
  )
}

export default DigestEmail

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import type { ReactNode } from "react"

interface MailShellProps {
  children: ReactNode
  eyebrow?: string
  preview: string
  title: string
}

interface MailButtonProps {
  children: ReactNode
  href: string
  tone?: "default" | "danger"
}

export function MailShell({
  children,
  eyebrow,
  preview,
  title,
}: MailShellProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="m-0 bg-[#050505] px-0 py-0 font-sans">
          <Container className="mx-auto max-w-[600px] px-6 py-10">
            <Section className="mb-8">
              <Row>
                <Column className="w-[42px]">
                  <Text className="m-0 h-[32px] w-[32px] rounded-lg border border-[#27272a] border-solid bg-[#0b0b0c] text-center font-semibold text-[15px] text-white leading-[32px]">
                    M
                  </Text>
                </Column>
                <Column>
                  <Text className="m-0 font-semibold text-[18px] text-white tracking-[-0.02em]">
                    Motiq
                  </Text>
                  <Text className="m-0 mt-1 text-[#71717a] text-[12px]">
                    Stop missing critical customer signals.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="rounded-2xl border border-[#27272a] border-solid bg-[#0a0a0b] px-8 py-8">
              {eyebrow ? (
                <Text className="m-0 mb-4 inline-block rounded-full border border-[#27272a] border-solid bg-[#111113] px-3 py-1 font-medium text-[#a1a1aa] text-[11px] uppercase tracking-[0.16em]">
                  {eyebrow}
                </Text>
              ) : null}
              <Heading className="m-0 mb-5 font-semibold text-[28px] text-white leading-[1.15] tracking-[-0.03em]">
                {title}
              </Heading>
              {children}
            </Section>

            <Section className="mt-8">
              <Hr className="m-0 border-[#18181b]" />
              <Text className="m-0 mt-5 text-[#52525b] text-[12px] leading-[20px]">
                Motiq monitors customer feedback across your stack and surfaces
                the signals that matter.
              </Text>
              <Text className="m-0 mt-3 text-[#52525b] text-[12px]">
                <Link
                  className="text-[#a1a1aa] no-underline"
                  href="https://motiq.app"
                >
                  motiq.app
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export function MailButton({
  children,
  href,
  tone = "default",
}: MailButtonProps) {
  const className =
    tone === "danger"
      ? "box-border inline-block rounded-lg bg-[#dc2626] px-5 py-3 text-center font-semibold text-[14px] text-white no-underline"
      : "box-border inline-block rounded-lg bg-white px-5 py-3 text-center font-semibold text-[14px] text-[#050505] no-underline"

  return (
    <Button className={className} href={href}>
      {children}
    </Button>
  )
}

export function MailText({ children }: { children: ReactNode }) {
  return (
    <Text className="m-0 mb-4 text-[#a1a1aa] text-[15px] leading-[24px]">
      {children}
    </Text>
  )
}

export function MailNote({ children }: { children: ReactNode }) {
  return (
    <Section className="mt-6 rounded-xl border border-[#27272a] border-solid bg-[#111113] px-4 py-3">
      <Text className="m-0 text-[#71717a] text-[12px] leading-[20px]">
        {children}
      </Text>
    </Section>
  )
}

export function SignalPanel({ children }: { children: ReactNode }) {
  return (
    <Section className="mb-5 rounded-xl border border-[#27272a] border-solid bg-[#0f0f10] px-4 py-4">
      {children}
    </Section>
  )
}

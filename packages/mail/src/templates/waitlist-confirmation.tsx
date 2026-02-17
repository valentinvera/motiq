import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components"

interface WaitlistConfirmationEmailProps {
  name?: string
}

export function WaitlistConfirmationEmail({
  name = "there",
}: WaitlistConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You're on the list — Motiq early access</Preview>
      <Tailwind>
        <Body className="bg-[#0a0a0a] font-sans">
          <Container className="mx-auto max-w-140 px-5 py-10">
            <Heading className="mb-6 font-bold text-[28px] text-white leading-tight">
              You're in.
            </Heading>
            <Text className="mb-4 text-[#a1a1aa] text-base leading-relaxed">
              Hi {name},
            </Text>
            <Text className="mb-4 text-[#a1a1aa] text-base leading-relaxed">
              Thanks for joining the Motiq waitlist. You're among the first to
              know when we launch.
            </Text>
            <Text className="mb-4 text-[#e4e4e7] text-base leading-relaxed">
              Motiq is your conversational data analyst for survey responses and
              form data. Skip the spreadsheets — just upload your CSV or connect
              your tools, then chat with your data in plain English.
            </Text>
            <Text className="mb-4 text-[#a1a1aa] text-base leading-relaxed">
              Ask questions, generate charts, discover insights. We handle the
              analysis while you focus on decisions.
            </Text>
            <Text className="mb-6 text-[#a1a1aa] text-base leading-relaxed">
              We'll email you when early access opens.
            </Text>
            <Text className="mt-8 text-[#71717a] text-sm">
              — The Motiq Team
              <br />
              <Link
                className="text-[#a1a1aa] underline hover:text-white"
                href="https://motiq.app"
              >
                motiq.app
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default WaitlistConfirmationEmail

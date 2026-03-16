import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
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
    <Html lang="en">
      <Tailwind>
        <Head />
        <Preview>You're on the list — Motiq early access</Preview>
        <Body className="bg-[#050505] font-sans">
          <Container className="mx-auto max-w-140 px-6 py-12">
            <Section className="text-center">
              <Text className="m-0 font-bold text-[22px] text-white tracking-tighter">
                Motiq
              </Text>
            </Section>

            <Section className="h-12" />

            <Section
              style={{
                backgroundColor: "#0a0a0a",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "48px 36px",
              }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{ margin: "0 auto 24px" }}
              >
                <tr>
                  <td
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "999px",
                      padding: "6px 16px",
                    }}
                  >
                    <Text className="m-0 font-medium text-[#71717a] text-[11px] uppercase tracking-widest">
                      ✦ Early Access
                    </Text>
                  </td>
                </tr>
              </table>

              <Heading className="m-0 mb-4 text-center font-medium text-[32px] text-white leading-tight tracking-tight">
                You're on the list.
              </Heading>

              <Text className="m-0 mb-8 text-center text-[#71717a] text-[16px] leading-relaxed">
                Hi {name}, welcome to the future of customer intelligence.
              </Text>

              <Hr
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  margin: "0 0 32px",
                }}
              />

              <table
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{ width: "100%", marginBottom: "32px" }}
              >
                <tr>
                  <td style={{ paddingBottom: "20px" }}>
                    <table cellPadding="0" cellSpacing="0" role="presentation">
                      <tr>
                        <td
                          style={{
                            width: "36px",
                            verticalAlign: "top",
                            paddingTop: "2px",
                          }}
                        >
                          <Text className="m-0 text-[#a1a1aa] text-[16px]">
                            →
                          </Text>
                        </td>
                        <td>
                          <Text className="m-0 text-[#d4d4d8] text-[15px] leading-relaxed">
                            <strong className="text-white">
                              AI agents that never sleep.
                            </strong>{" "}
                            Autonomous monitoring across every feedback channel,
                            24/7.
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "20px" }}>
                    <table cellPadding="0" cellSpacing="0" role="presentation">
                      <tr>
                        <td
                          style={{
                            width: "36px",
                            verticalAlign: "top",
                            paddingTop: "2px",
                          }}
                        >
                          <Text className="m-0 text-[#a1a1aa] text-[16px]">
                            →
                          </Text>
                        </td>
                        <td>
                          <Text className="m-0 text-[#d4d4d8] text-[15px] leading-relaxed">
                            <strong className="text-white">
                              Churn detected before it hits.
                            </strong>{" "}
                            Patterns, risks, and critical signals surfaced
                            automatically.
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table cellPadding="0" cellSpacing="0" role="presentation">
                      <tr>
                        <td
                          style={{
                            width: "36px",
                            verticalAlign: "top",
                            paddingTop: "2px",
                          }}
                        >
                          <Text className="m-0 text-[#a1a1aa] text-[16px]">
                            →
                          </Text>
                        </td>
                        <td>
                          <Text className="m-0 text-[#d4d4d8] text-[15px] leading-relaxed">
                            <strong className="text-white">
                              90-day historical scan included.
                            </strong>{" "}
                            Connect your stack and get insights from day one —
                            no cold start.
                          </Text>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <Hr
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  margin: "0 0 32px",
                }}
              />

              <Section className="text-center">
                <Button
                  className="box-border rounded-lg bg-white px-8 py-4 text-center font-medium text-[#000000] text-[15px] no-underline"
                  href="https://motiq.app"
                >
                  Visit Motiq →
                </Button>
              </Section>

              <Text className="m-0 mt-6 text-center text-[#52525b] text-[13px]">
                We'll notify you the moment early access opens.
              </Text>
            </Section>

            <Section className="mt-12 text-center">
              <Text className="m-0 mb-1 text-[#3f3f46] text-[12px]">
                — The Motiq Team
              </Text>
              <Link
                className="text-[#52525b] text-[12px] no-underline"
                href="https://motiq.app"
              >
                motiq.app
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

WaitlistConfirmationEmail.PreviewProps = {
  name: "Valen",
} satisfies WaitlistConfirmationEmailProps

export default WaitlistConfirmationEmail

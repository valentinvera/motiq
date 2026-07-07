import { Hr } from "@react-email/components"
import { MailButton, MailNote, MailShell, MailText } from "./_components"

interface WaitlistConfirmationEmailProps {
  name?: string
}

export function WaitlistConfirmationEmail({
  name = "there",
}: WaitlistConfirmationEmailProps) {
  return (
    <MailShell
      eyebrow="Waitlist"
      preview="You're on the Motiq waitlist."
      title="You're on the list"
    >
      <MailText>Hi {name},</MailText>
      <MailText>
        Thanks for joining the Motiq waitlist. We are building autonomous
        customer intelligence for teams that need to catch critical signals
        before they become churn.
      </MailText>
      <MailNote>
        We will send product updates and early access details to this email.
      </MailNote>
      <Hr className="my-6 border-[#27272a]" />
      <MailButton href="https://motiq.app">Visit Motiq</MailButton>
    </MailShell>
  )
}

export default WaitlistConfirmationEmail

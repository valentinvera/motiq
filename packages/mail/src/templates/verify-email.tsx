import { MailButton, MailNote, MailShell, MailText } from "./_components"

interface VerifyEmailProps {
  name: string
  url: string
}

export function VerifyEmail({ name = "there", url = "#" }: VerifyEmailProps) {
  return (
    <MailShell
      eyebrow="Account security"
      preview="Verify your email - Motiq"
      title="Verify your email"
    >
      <MailText>Hi {name},</MailText>
      <MailText>
        Confirm this email address to finish setting up your Motiq account and
        start monitoring customer signals.
      </MailText>
      <MailButton href={url}>Verify email</MailButton>
      <MailNote>
        If you did not create a Motiq account, you can safely ignore this email.
      </MailNote>
    </MailShell>
  )
}

export default VerifyEmail

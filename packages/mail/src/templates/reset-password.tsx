import { MailButton, MailNote, MailShell, MailText } from "./_components"

interface ResetPasswordProps {
  name: string
  url: string
}

export function ResetPassword({
  name = "there",
  url = "#",
}: ResetPasswordProps) {
  return (
    <MailShell
      eyebrow="Account security"
      preview="Reset your password - Motiq"
      title="Reset your password"
    >
      <MailText>Hi {name},</MailText>
      <MailText>
        We received a request to reset your Motiq password. Use the secure link
        below to choose a new one.
      </MailText>
      <MailButton href={url}>Reset password</MailButton>
      <MailNote>
        This link expires in 1 hour. If you did not request a reset, you can
        ignore this email.
      </MailNote>
    </MailShell>
  )
}

export default ResetPassword

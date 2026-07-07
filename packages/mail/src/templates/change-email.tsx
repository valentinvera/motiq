import { Text } from "@react-email/components"
import { MailButton, MailNote, MailShell, MailText } from "./_components"

interface ChangeEmailProps {
  name: string
  newEmail: string
  url: string
}

export function ChangeEmail({
  name = "there",
  newEmail = "",
  url = "#",
}: ChangeEmailProps) {
  return (
    <MailShell
      eyebrow="Account security"
      preview="Confirm your new email - Motiq"
      title="Confirm email change"
    >
      <MailText>Hi {name},</MailText>
      <MailText>
        You requested to move your Motiq account to this email address:
      </MailText>
      <Text className="m-0 mb-5 rounded-lg border border-[#27272a] border-solid bg-[#111113] px-3 py-2 font-medium text-[14px] text-white">
        {newEmail}
      </Text>
      <MailButton href={url}>Confirm new email</MailButton>
      <MailNote>
        If you did not request this change, you can safely ignore this email.
      </MailNote>
    </MailShell>
  )
}

export default ChangeEmail

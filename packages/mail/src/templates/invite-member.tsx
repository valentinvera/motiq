import { Text } from "@react-email/components"
import { MailButton, MailNote, MailShell, MailText } from "./_components"

interface InviteMemberProps {
  orgName: string
  inviterName: string
  role: string
  url: string
}

export function InviteMember({
  orgName = "your team",
  inviterName = "Someone",
  role = "member",
  url = "#",
}: InviteMemberProps) {
  return (
    <MailShell
      eyebrow="Workspace invitation"
      preview={`${inviterName} invited you to ${orgName} on Motiq`}
      title={`Join ${orgName}`}
    >
      <MailText>
        {inviterName} invited you to collaborate in Motiq, where your team
        monitors feedback, detects risk, and acts on critical customer signals.
      </MailText>
      <Text className="m-0 mb-5 rounded-lg border border-[#27272a] border-solid bg-[#111113] px-3 py-2 text-[#a1a1aa] text-[14px]">
        Role: <span className="font-semibold text-white">{role}</span>
      </Text>
      <MailButton href={url}>Accept invitation</MailButton>
      <MailNote>
        If you were not expecting this invitation, you can safely ignore this
        email.
      </MailNote>
    </MailShell>
  )
}

export default InviteMember

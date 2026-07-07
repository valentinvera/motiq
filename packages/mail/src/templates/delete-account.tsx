import { MailButton, MailNote, MailShell, MailText } from "./_components"

interface DeleteAccountProps {
  name: string
  url: string
}

export function DeleteAccount({
  name = "there",
  url = "#",
}: DeleteAccountProps) {
  return (
    <MailShell
      eyebrow="Destructive action"
      preview="Confirm account deletion - Motiq"
      title="Delete your account"
    >
      <MailText>Hi {name},</MailText>
      <MailText>
        You requested to delete your Motiq account. This permanently removes
        your account data, workspace access, connected apps, signals, alerts,
        chats, activity, and pipeline history.
      </MailText>
      <MailButton href={url} tone="danger">
        Delete my account
      </MailButton>
      <MailNote>
        This link expires in 1 hour. If you did not request this, ignore this
        email and your account will remain active.
      </MailNote>
    </MailShell>
  )
}

export default DeleteAccount

import { sendEmail } from "./resend"
import { WaitlistEmail } from "@/emails/waitlist"

interface SendWaitlistEmailOptions {
  to: string
  name: string
}

export const sendWaitlistEmail = async ({ to, name }: SendWaitlistEmailOptions) => {
  return await sendEmail({
    to,
    subject: "You're on the waitlist!",
    react: WaitlistEmail({ name }),
  })
}

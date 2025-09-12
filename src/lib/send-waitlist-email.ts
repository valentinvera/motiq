import { sendEmail } from "./resend"
import { WaitlistEmail } from "@/emails/waitlist"

interface SendWaitlistEmailOptions {
  to: string
  name: string
}

export const sendWaitlistEmail = async ({ to, name }: SendWaitlistEmailOptions) => {
  return await sendEmail({
    to,
    subject: "Welcome to Motiq",
    react: WaitlistEmail({ name }),
  })
}

import { Resend } from "resend"
import { render } from "@react-email/components"
import type { ReactElement } from "react"
import { env } from "@/env/server"

interface SendEmailOptions {
  to: string
  subject: string
  react: ReactElement
}

const resend = new Resend(env.RESEND_API_KEY)

export const sendEmail = async ({ to, subject, react }: SendEmailOptions) => {
  const html = await render(react)

  try {
    const { data, error } = await resend.emails.send({
      from: "Motiq <noreply@motiq-ai.is-a.software>",
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Error from Resend:", JSON.stringify(error, null, 2))
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Caught an exception while sending email:", error)
    if (error && typeof error === "object" && "message" in error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
    throw new Error("Failed to send email due to an unexpected error.")
  }
}

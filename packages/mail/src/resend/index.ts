import { env } from "@motiq/env/api"
import { render } from "@react-email/render"
import { Resend } from "resend"

const resend = new Resend(env.RESEND_API_KEY)

export interface EmailContact {
  email: string
  subscribed: boolean
}

export const sendEmail = async (options: {
  to: string
  subject: string
  body: string
  from?: string
}): Promise<{ success: boolean; id?: string }> => {
  try {
    const { data, error } = await resend.emails.send({
      from: options.from ?? "Motiq <noreply@motiq.app>",
      to: options.to,
      subject: options.subject,
      html: options.body,
    })

    if (error) {
      console.error("Resend API error:", error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false }
  }
}

export const sendReactEmail = async (options: {
  to: string
  subject: string
  react: React.ReactElement
  from?: string
}): Promise<{ success: boolean; id?: string }> => {
  try {
    const html = await render(options.react)

    const { data, error } = await resend.emails.send({
      from: options.from ?? "Motiq <noreply@motiq.app>",
      to: options.to,
      subject: options.subject,
      html,
    })

    if (error) {
      console.error("Resend API error:", error)
      return { success: false }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false }
  }
}

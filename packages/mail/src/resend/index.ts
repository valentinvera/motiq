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

export const createContact = async (
  email: string,
  data?: Record<string, string>
): Promise<{ success: boolean; isNew: boolean; message: string }> => {
  const { db } = await import("@motiq/db")
  const { waitlist } = await import("@motiq/db/schema/waitlist")

  try {
    await db.insert(waitlist).values({
      email,
      source: data?.source ?? "landing",
      metadata: data ?? {},
    })

    return {
      success: true,
      isNew: true,
      message: "Contact created successfully",
    }
  } catch (error) {
    console.log("Email may already exist in DB:", error)
    return {
      success: true,
      isNew: false,
      message: "You're already on the list!",
    }
  }
}

export const joinWaitlist = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  const result = await createContact(email, {
    source: "waitlist",
    product: "motiq",
    joinedAt: new Date().toISOString(),
  })

  if (result.isNew) {
    const { WaitlistConfirmationEmail } = await import(
      "../templates/waitlist-confirmation"
    )
    await sendReactEmail({
      to: email,
      subject: "You're on the list — Motiq",
      from: "Motiq <noreply@motiq.app>",
      react: WaitlistConfirmationEmail({ name: email.split("@")[0] }),
    })
  }

  return { success: result.success, message: result.message }
}

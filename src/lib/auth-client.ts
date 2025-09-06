import { createAuthClient } from "better-auth/react"
import { env } from "@/env/client"

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  resetPassword,
  forgetPassword,
  changePassword,
  changeEmail,
  verifyEmail,
  sendVerificationEmail,
  deleteUser,
  accountInfo,
} = createAuthClient({
  baseURL: env.VITE_BASE_URL,
})

import { wrapVinxiConfigWithSentry } from "@sentry/tanstackstart-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react-swc"
import { defineConfig, loadEnv } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart({
        customViteReactPlugin: true,
      }),
      viteReact(),
    ],
    server: {
      port: Number(env.VITE_PORT),
    },
  }
})

export default wrapVinxiConfigWithSentry(config, {
  org: process.env.VITE_SENTRY_ORG,
  project: process.env.VITE_SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
})

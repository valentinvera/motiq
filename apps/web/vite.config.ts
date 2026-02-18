import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig, loadEnv } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  const secureValue = env.VITE_PROXY_SECURE === "true"

  const cookieDomainRewriteValue =
    env.VITE_PROXY_COOKIE_DOMAIN_REWRITE === "false"
      ? false
      : env.VITE_PROXY_COOKIE_DOMAIN_REWRITE || "localhost"

  return {
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss({ optimize: true }),
      tanstackStart({
        sitemap: {
          enabled: true,
          outputPath: "./public/sitemap.xml",
          host: "https://motiq.app",
        },
      }),
      nitro(),
      viteReact({
        babel: {
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
    ],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return
          }
          warn(warning)
        },
      },
    },
    server: {
      port: Number(env.VITE_PORT),
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: secureValue,
          cookieDomainRewrite: cookieDomainRewriteValue,
          autoRewrite: true,
          timeout: 30_000,
        },
      },
    },
  }
})

export default config

import { defineConfig } from "tsdown"

export default defineConfig({
  entry: { api: "./src/api.ts", web: "./src/web.ts" },
  format: "esm",
  dts: !process.env.VERCEL,
  outDir: "dist",
})

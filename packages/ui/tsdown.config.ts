import { defineConfig } from "tsdown"

export default defineConfig({
  entry: "src/**/*.{ts,tsx}",
  format: "esm",
  dts: !process.env.VERCEL,
  unbundle: true,
  outDir: "dist",
})

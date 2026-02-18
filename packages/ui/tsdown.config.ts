import { defineConfig } from "tsdown"

export default defineConfig({
  entry: "src/**/*.{ts,tsx}",
  format: "esm",
  dts: true,
  unbundle: true,
  outDir: "dist",
})

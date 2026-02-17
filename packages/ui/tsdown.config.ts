import { defineConfig } from "tsdown"

export default defineConfig({
  entry: "src/**/*.{ts,tsx}",
  dts: true,
  unbundle: true,
})

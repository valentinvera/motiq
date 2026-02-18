import { defineConfig } from "tsdown"

export default defineConfig({
  entry: { index: "./src/index.ts", "lib/payments": "./src/lib/payments.ts" },
  format: "esm",
  noExternal: [/@motiq\/.*/],
  dts: true,
  outDir: "dist",
})

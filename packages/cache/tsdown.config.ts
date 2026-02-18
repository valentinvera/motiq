import { defineConfig } from "tsdown"

export default defineConfig({
  entry: { index: "./src/index.ts" },
  format: "esm",
  noExternal: [/@motiq\/.*/],
  dts: !process.env.VERCEL,
  outDir: "dist",
})

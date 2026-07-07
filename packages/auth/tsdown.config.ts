import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    "lib/payments": "./src/lib/payments.ts",
    plans: "./src/plans.ts",
    permissions: "./src/permissions.ts",
  },
  format: "esm",
  noExternal: [/@motiq\/.*/],
  dts: !process.env.VERCEL,
  outDir: "dist",
})

import { defineConfig } from "tsdown"

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    "schema/auth": "./src/schema/auth.ts",
  },
  format: "esm",
  noExternal: [/@motiq\/.*/],
  dts: !process.env.VERCEL,
  outDir: "dist",
})

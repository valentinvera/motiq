import { defineConfig } from "tsdown"

export default defineConfig({
  entry: "./src/index.ts",
  format: "esm",
  noExternal: [/@motiq\/.*/],
  dts: false,
  outDir: "api",
})

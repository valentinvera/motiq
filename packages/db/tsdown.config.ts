import { readdirSync } from "node:fs"
import { basename, extname } from "node:path"
import { defineConfig } from "tsdown"

const schemaEntries = Object.fromEntries(
  readdirSync(new URL("./src/schema", import.meta.url))
    .filter((file) => extname(file) === ".ts")
    .map((file) => [`schema/${basename(file, ".ts")}`, `./src/schema/${file}`])
)

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    ...schemaEntries,
  },
  format: "esm",
  noExternal: [/@motiq\/.*/],
  dts: !process.env.VERCEL,
  outDir: "dist",
})

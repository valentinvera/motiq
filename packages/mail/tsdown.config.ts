import { readdirSync } from "node:fs"
import { basename, extname } from "node:path"
import { defineConfig } from "tsdown"

const templateEntries = Object.fromEntries(
  readdirSync(new URL("./src/templates", import.meta.url))
    .filter((file) => [".ts", ".tsx"].includes(extname(file)))
    .map((file) => [
      `templates/${basename(file, extname(file))}`,
      `./src/templates/${file}`,
    ])
)

export default defineConfig({
  entry: {
    "resend/index": "./src/resend/index.ts",
    ...templateEntries,
  },
  format: "esm",
  noExternal: [/@motiq\/.*/],
  dts: !process.env.VERCEL,
  outDir: "dist",
})

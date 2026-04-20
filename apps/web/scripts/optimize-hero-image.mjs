import { statSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"

const PUBLIC_DIR = join(process.cwd(), "public")
const SOURCE = join(process.cwd(), "scripts", "hero-image-source.png")
const WIDTHS = [800, 1200, 1600, 2400]

const formats = [
  {
    ext: "avif",
    options: { quality: 55, effort: 6 },
  },
  {
    ext: "webp",
    options: { quality: 78, effort: 6 },
  },
]

const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`

const source = sharp(SOURCE)
const metadata = await source.metadata()
console.log(
  `Source: hero-image.png ${metadata.width}x${metadata.height} (${formatSize(statSync(SOURCE).size)})`,
)

for (const width of WIDTHS) {
  for (const { ext, options } of formats) {
    const outName = `hero-image-${width}.${ext}`
    const outPath = join(PUBLIC_DIR, outName)
    await sharp(SOURCE)
      .resize({ width, withoutEnlargement: true })
      .toFormat(ext, options)
      .toFile(outPath)
    console.log(`  → ${outName} (${formatSize(statSync(outPath).size)})`)
  }
}

console.log("Done.")

import { statSync, writeFileSync } from "node:fs"
import { glob } from "glob"
import { SitemapStream, streamToPromise } from "sitemap"

const BASE_URL = "https://motiq.app"

const REG_INDEX = /\/index\.tsx$/
const REG_AUTH = /\/\(auth\)/
const REG_ROOT = /\/__root\.tsx$/
const REG_TSX = /\.tsx$/

const formatUrl = (file) => {
  if (file.includes("$") || file.includes("/api/")) {
    return null
  }

  return file
    .replace("src/routes", "")
    .replace(REG_INDEX, "/")
    .replace(REG_AUTH, "")
    .replace(REG_ROOT, "/")
    .replace(REG_TSX, "")
}

const generateSitemap = async () => {
  console.log("Generating sitemap...")

  const routeFiles = await glob("src/routes/**/*.tsx")

  const seen = new Set()
  const urls = routeFiles
    .map((file) => {
      const url = formatUrl(file)
      if (!url) {
        return null
      }
      const stats = statSync(file)
      const lastmod = stats.mtime.toISOString()
      const priority = url === "/" ? 1.0 : 0.7
      return { url, lastmod, changefreq: "daily", priority }
    })
    .filter(Boolean)
    .filter(({ url }) => {
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })

  const stream = new SitemapStream({ hostname: BASE_URL })

  for (const url of urls) {
    stream.write(url)
  }

  stream.end()

  const sitemapXml = await streamToPromise(stream).then((data) =>
    data.toString()
  )

  writeFileSync("public/sitemap.xml", sitemapXml)

  console.log("Sitemap generated successfully at public/sitemap.xml")
}

generateSitemap()

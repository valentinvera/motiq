import { writeFileSync, statSync } from "fs"
import { glob } from "glob"
import { SitemapStream, streamToPromise } from "sitemap"
import prettier from "prettier"

const BASE_URL = "https://motiq-ai.vercel.app"

function formatUrl(file) {
  if (file.includes("$") || file.includes("/api/")) {
    return null
  }

  return file
    .replace("src/routes", "")
    .replace(/\/index\.tsx$/, "/")
    .replace(/\/\(auth\)/, "")
    .replace(/\/__root\.tsx$/, "/")
    .replace(/\.tsx$/, "")
}

async function generateSitemap() {
  console.log("✨ Generating sitemap...")

  const routeFiles = await glob("src/routes/**/*.tsx")

  const urls = routeFiles
    .map(file => {
      const url = formatUrl(file)
      if (!url) return null

      const stats = statSync(file)
      const lastmod = stats.mtime.toISOString()

      const priority = url === "/" ? 1.0 : 0.7

      return { url, lastmod, changefreq: "daily", priority }
    })
    .filter(Boolean)

  const stream = new SitemapStream({ hostname: BASE_URL })

  urls.forEach(url => stream.write(url))
  stream.end()

  const sitemapXml = await streamToPromise(stream).then(data => data.toString())

  const formattedSitemap = await prettier.format(sitemapXml, {
    parser: "html",
  })

  writeFileSync("public/sitemap.xml", formattedSitemap)

  console.log("✅ Sitemap generated successfully at public/sitemap.xml")
}

generateSitemap()

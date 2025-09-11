interface SeoProps {
  title: string
  description: string
  keywords?: string | Array<string>
  image?: string
  url?: string
}

const SITE_URL = "https://motiq-ai.vercel.app"
const SITE_NAME = "Motiq"
const TWITTER_HANDLE = "@motiq_ai"
const DEFAULT_IMAGE_URL = "/favicon.svg"

export const seo = ({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE_URL,
  url = "/",
}: SeoProps) => {
  const absoluteUrl = `${SITE_URL}${url}`
  const absoluteImageUrl = `${SITE_URL}${image}`

  const formattedKeywords = Array.isArray(keywords) ? keywords.join(", ") : keywords

  const tags = [
    { title: `${title}` },
    { name: "description", content: description },
    { name: "keywords", content: formattedKeywords },
    { property: "og:title", content: `${title} ${SITE_NAME}` },
    { property: "og:description", content: description },
    { property: "og:url", content: absoluteUrl },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: absoluteImageUrl },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${title} | ${SITE_NAME}` },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: absoluteImageUrl },
    { name: "twitter:creator", content: TWITTER_HANDLE },
    { name: "twitter:site", content: TWITTER_HANDLE },
  ]

  return tags.filter(tag => {
    if ("content" in tag) {
      return !!tag.content
    }
    return true
  })
}

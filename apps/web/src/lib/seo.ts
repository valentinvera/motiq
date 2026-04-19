export const SEO = {
  siteName: "Motiq",
  siteUrl: "https://motiq.app",
  title: "Motiq — Autonomous Customer Intelligence for B2B SaaS",
  titleTemplate: "%s — Motiq",
  description:
    "AI agents that monitor every feedback channel 24/7, detect churn before it happens, and act autonomously. Stop firefighting, start scaling customer intelligence.",
  keywords: [
    "customer intelligence",
    "AI agents",
    "autonomous customer success",
    "churn prevention",
    "feedback monitoring",
    "B2B SaaS",
    "customer feedback platform",
    "customer insights AI",
    "signal detection",
    "product feedback AI",
  ],
  ogImage: "/og-image.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterHandle: "@motiq_app",
  themeColor: "#000000",
  locale: "en_US",
  lang: "en",
  author: "Motiq Inc.",
} as const

export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SEO.siteName,
  url: SEO.siteUrl,
  logo: `${SEO.siteUrl}/favicon.svg`,
  description: SEO.description,
  sameAs: ["https://x.com/motiq_app", "https://github.com/valentinvera/motiq"],
} as const

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SEO.siteName,
  url: SEO.siteUrl,
  description: SEO.description,
  inLanguage: SEO.lang,
  publisher: {
    "@type": "Organization",
    name: SEO.siteName,
    url: SEO.siteUrl,
  },
} as const

export const SOFTWARE_APPLICATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SEO.siteName,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Customer Intelligence Platform",
  operatingSystem: "Web",
  description: SEO.description,
  url: SEO.siteUrl,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/PreOrder",
  },
  creator: {
    "@type": "Organization",
    name: SEO.siteName,
    url: SEO.siteUrl,
  },
} as const

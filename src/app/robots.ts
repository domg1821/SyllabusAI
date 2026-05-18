import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://syllabusai.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/account", "/settings", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}

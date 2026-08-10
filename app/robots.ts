import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/artists-portal/", "/streamers-portal/", "/api/"],
    },
    sitemap: "https://www.loyalfoxrecords.com/sitemap.xml",
  };
}

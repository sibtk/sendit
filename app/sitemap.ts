import { MetadataRoute } from "next";
import { STATE_TITLE_LAWS } from "@/lib/state-title-laws";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://senditscan.com";

  // Generate state-specific URLs for SEO — 50 individual pages
  const statePages = Object.values(STATE_TITLE_LAWS).map(law => ({
    url: `${baseUrl}/tools/title-laws/${law.state.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Cross-state transfer pages — top origin × destination combos
  const origins = ["california", "new-york", "florida", "texas", "pennsylvania", "michigan", "ohio", "illinois", "georgia", "new-jersey"];
  const destinations = ["texas", "florida", "oklahoma", "arkansas", "north-carolina", "georgia", "alabama", "indiana", "arizona", "illinois"];
  const crossStatePages: MetadataRoute.Sitemap = [];
  for (const from of origins) {
    for (const to of destinations) {
      if (from !== to) {
        crossStatePages.push({
          url: `${baseUrl}/tools/title-laws/${from}-to-${to}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        });
      }
    }
  }

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/tools/fees`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tools/shipping`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tools/title-laws`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/blog/copart-fees-guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog/iaa-fees-guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog/copart-vs-iaa`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/how-to-estimate-repair-costs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog/salvage-vs-rebuilt-title`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/most-profitable-cars-to-flip`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog/state-title-laws-guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...statePages,
    ...crossStatePages,
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}

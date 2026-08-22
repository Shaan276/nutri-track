export const siteConfig = {
  name: "Nutri-Track",
  tagline: "HEALTH OS",
  description: "Modern, minimal, high-precision health & nutrition operating system.",
  links: {
    github: "https://github.com/nutri-track",
  },
  accentColor: "#10b981", // Emerald 500
} as const;

export type SiteConfig = typeof siteConfig;

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بيني وايز — إدارة وتتبع المصروفات الشخصية",
    short_name: "بيني وايز",
    description: "تتبع دخلك ومصروفاتك ومحافظك المالية والميزانية الشهرية بالجنيه المصري",
    start_url: "/",
    display: "standalone",
    background_color: "#0b100d",
    theme_color: "#0b100d",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}


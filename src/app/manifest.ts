import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "محفظتي — إدارة وتتبع المصروفات الشخصية",
    short_name: "محفظتي",
    description: "تتبع دخلك ومصروفاتك ومحافظك المالية والميزانية الشهرية بالجنيه المصري",
    start_url: "/",
    display: "standalone",
    background_color: "#f8faf9",
    theme_color: "#2563eb",
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


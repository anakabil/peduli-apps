import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PEDULI Apps - PT. Garuda Yamato Steel",
    short_name: "PEDULI",
    description: "Pelaporan Bahaya dan Upaya Pengendalian",
    start_url: "/beranda?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f7f5",
    theme_color: "#006042",
    lang: "id",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Lapor bahaya", short_name: "Lapor", url: "/lapor", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Laporan saya", short_name: "Laporan", url: "/laporan", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

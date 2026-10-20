import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Permission Next", short_name: "PN", description: "พื้นที่ทำงานของทีม", start_url: "/", display: "standalone", icons: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }] }; }

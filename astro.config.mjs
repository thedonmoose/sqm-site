import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://sqm-site.pages.dev",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
    // No inline <script>s, so the CSP can use script-src 'self' (public/_headers).
    build: { assetsInlineLimit: 0 },
  },
});

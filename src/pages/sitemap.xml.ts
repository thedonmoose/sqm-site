import type { APIRoute } from "astro";
import { getVehicles } from "../lib/data";
import { isSoldWithinDays } from "../lib/types";

const STATIC_PATHS = [
  "/",
  "/inventory/",
  "/about/",
  "/contact/",
  "/tell-us/",
  "/test-drive/",
  "/privacy/",
  "/terms/",
  "/accessibility/",
];

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** §7: all static pages + vehicle pages; sold vehicles drop out after 30 days. */
export const GET: APIRoute = async ({ site }) => {
  const vehicles = await getVehicles();
  const entries: { loc: string; lastmod?: string }[] = STATIC_PATHS.map((path) => ({
    loc: new URL(path, site).href,
  }));
  for (const vehicle of vehicles) {
    if (vehicle.status === "sold" && !isSoldWithinDays(vehicle, 30)) continue;
    entries.push({
      loc: new URL(`/vehicles/${vehicle.slug}/`, site).href,
      lastmod: vehicle.status === "sold" ? vehicle.dateSold : vehicle.datePosted,
    });
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (entry) =>
          `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${
            entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""
          }\n  </url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

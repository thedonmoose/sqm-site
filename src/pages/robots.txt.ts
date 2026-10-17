import type { APIRoute } from "astro";

/** Endpoint (not a static file) so the Sitemap URL follows PUBLIC_SITE_URL. */
export const GET: APIRoute = ({ site }) => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "",
    `Sitemap: ${new URL("sitemap.xml", site).href}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

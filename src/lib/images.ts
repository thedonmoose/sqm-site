export type ResponsiveImageSlot = "card" | "gallery" | "thumbnail" | "lightboxThumb";

const IMAGE_SIZES: Record<ResponsiveImageSlot, string> = {
  card: [
    "(max-width: 639px) calc(100vw - 40px)",
    "(max-width: 767px) calc((100vw - 64px) / 2)",
    "(max-width: 1023px) calc((100vw - 104px) / 2)",
    "(max-width: 1359px) calc((100vw - 144px) / 3)",
    "405px",
  ].join(", "),
  gallery: [
    "(max-width: 767px) calc(100vw - 40px)",
    "(max-width: 1023px) calc(100vw - 80px)",
    "(max-width: 1359px) calc(100vw - 656px)",
    "704px",
  ].join(", "),
  thumbnail: [
    "(max-width: 767px) calc((100vw - 64px) / 4)",
    "(max-width: 1023px) calc((100vw - 128px) / 5)",
    "(max-width: 1359px) calc((100vw - 704px) / 5)",
    "131px",
  ].join(", "),
  lightboxThumb: "96px",
};

function localCandidate(src: string, width: number): string {
  const url = new URL(src, "https://sqm.invalid");
  url.pathname = url.pathname.replace(/\/(\d+)\.webp$/, `/$1-${width}w.webp`);
  return `${url.pathname}${url.search}${url.hash}`;
}

function isRemote(src: string): boolean {
  return /^https?:\/\//.test(src);
}

/** Every Sanity URL we emit carries transform params: Sanity serves a bare
 * asset URL byte-for-byte, camera EXIF/GPS included, while a transformed one
 * is re-encoded. */
function sanityUrl(src: string, params: Record<string, string | number>): string {
  const url = new URL(src);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url.toString();
}

/** 1200×630 crop for og:image. */
export function shareImage(src: string): string {
  return isRemote(src) ? sanityUrl(src, { w: 1200, h: 630, fit: "crop", fm: "jpg", q: 80 }) : src;
}

/** Full-resolution JPEG for staff to download and post to marketplaces. */
export function downloadImage(src: string): string {
  return isRemote(src) ? sanityUrl(src, { w: 2400, fit: "max", fm: "jpg", q: 90 }) : src;
}

export function responsiveImage(
  src: string,
  slot: ResponsiveImageSlot = "card",
): { src: string; srcset: string; sizes: string } {
  let candidates: [string, number][];
  if (src.startsWith("/images/vehicles/") && /\/\d+\.webp(?:\?.*)?$/.test(src)) {
    candidates = [
      [localCandidate(src, 400), 400],
      [localCandidate(src, 800), 800],
      [src, 1600],
    ];
  } else if (isRemote(src)) {
    candidates = [400, 800, 1600].map((w) => [sanityUrl(src, { w, auto: "format", fit: "max", q: 80 }), w]);
  } else {
    candidates = [[src, 1600]];
  }
  return {
    src: candidates[candidates.length - 1][0],
    srcset: candidates.map(([url, width]) => `${url} ${width}w`).join(", "),
    sizes: IMAGE_SIZES[slot],
  };
}

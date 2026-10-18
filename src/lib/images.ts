export type ResponsiveImageSlot = "card" | "gallery" | "thumbnail";

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
};

function localCandidate(src: string, width: number): string {
  const url = new URL(src, "https://sqm.invalid");
  url.pathname = url.pathname.replace(/\/(\d+)\.webp$/, `/$1-${width}w.webp`);
  return `${url.pathname}${url.search}${url.hash}`;
}

function sanityCandidate(src: string, width: number): string {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  url.searchParams.set("q", "80");
  return url.toString();
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
  } else if (/^https?:\/\//.test(src)) {
    candidates = [400, 800, 1600].map((width) => [sanityCandidate(src, width), width]);
  } else {
    candidates = [[src, 1600]];
  }
  return {
    src,
    srcset: candidates.map(([url, width]) => `${url} ${width}w`).join(", "),
    sizes: IMAGE_SIZES[slot],
  };
}

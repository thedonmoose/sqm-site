import type { Address, HoursLine } from "../lib/types";

/**
 * Single source for owner-supplied values.
 * Values marked [CONFIRM] in the spec are null until the owner supplies them:
 * never invent them. Components must render a labelled "coming soon" disabled
 * state when a value is null.
 */
export const site = {
  name: "Serene Quality Motors",
  omvicRegistration: "5923529",
  address: {
    street: "4650 Kingston Rd",
    city: "Scarborough",
    province: "ON",
    postal: "M1E 2P9",
  } satisfies Address,
  googleReviewUrl: "https://maps.google.com/?cid=12411628102256281162",
  // Storefront coordinates for schema.org GeoCoordinates (§7).
  geo: { latitude: 43.7755185, longitude: -79.1765398 },

  // [CONFIRM] owner values — null until supplied.
  phone: null as string | null,
  textPhone: null as string | null,
  email: null as string | null,
  hours: null as HoursLine[] | null,
  registeredLegalName: null as string | null,
  domain: null as string | null,

  // Files produced outside the repo; referenced as-is.
  heroVideo: {
    desktopMp4: "/media/hero/hero-desktop.mp4",
    desktopWebm: "/media/hero/hero-desktop.webm",
    mobileMp4: "/media/hero/hero-mobile.mp4",
    mobileWebm: "/media/hero/hero-mobile.webm",
    posterAvif: "/media/hero/poster.avif",
    posterWebp: "/media/hero/poster.webp",
  },
};

export function fullAddress(address: Address = site.address): string {
  return `${address.street}, ${address.city}, ${address.province} ${address.postal}`;
}

/** tel: link for the given (or the site's) phone; null while no phone exists. */
export function telHref(phone: string | null | undefined = site.phone): string | null {
  return phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;
}

/** sms: link for the text-capable number; null while none exists. */
export function smsHref(
  phone: string | null | undefined = site.textPhone,
  message?: string,
): string | null {
  if (!phone) return null;
  const body = message ? `?body=${encodeURIComponent(message)}` : "";
  return `sms:${phone.replace(/[^+\d]/g, "")}${body}`;
}

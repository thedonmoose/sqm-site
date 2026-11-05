import type { Address } from "../lib/types";

/**
 * Single source for owner-supplied values.
 * Values marked [CONFIRM] in the spec are null until the owner supplies them:
 * never invent them. Components must render a labelled "coming soon" disabled
 * state when a value is null.
 */
export const site = {
  name: "Serene Quality Motors",
  omvic: { name: "OMVIC", fullName: "Ontario Motor Vehicle Industry Council" },
  ucda: { name: "UCDA", fullName: "Used Car Dealers Association of Ontario" },
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
  phone: "437-603-4650" as string | null,
  textPhone: "437-603-4650" as string | null,
  email: "sales@sereneqmotors.ca" as string | null,
  hours: "By Appointment Only" as string | null,
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

/** OMVIC's required paragraph for any ad of a vehicle sold as-is (As-Is Sales
 * Guideline; O. Reg. 333/08 s. 40(6)). Every non-certified vehicle is sold as-is. */
export const AS_IS_STATEMENT =
  "The motor vehicle sold under this contract is being sold \u201Cas-is\u201D and is not represented as being in road worthy condition, mechanically sound or maintained at any guaranteed level of quality. The vehicle may not be fit for use as a means of transportation and may require substantial repairs at the purchaser\u2019s expense. It may not be possible to register the vehicle to be driven in its current condition.";

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

/** WhatsApp click-to-chat link; wa.me needs the full international number. */
export function whatsappHref(phone: string | null | undefined = site.textPhone): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `1${digits}` : digits}`;
}

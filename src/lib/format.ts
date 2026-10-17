import type { Transmission, Vehicle } from "./types";

const numberFmt = new Intl.NumberFormat("en-CA");
const priceFmt = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

/** All-in CAD price; one lockstep format for cards, panels, feeds, schema.org. */
export function formatPrice(cad: number): string {
  return priceFmt.format(cad);
}

export function formatKm(km: number): string {
  return `${numberFmt.format(km)} km`;
}

/** Shopper-facing transmission label; shared by card meta and vehicle page meta. */
export function formatTransmission(t: Transmission): string {
  return t === "cvt" ? "CVT" : t.charAt(0).toUpperCase() + t.slice(1);
}

export function vehicleTitle(v: Vehicle): string {
  return `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`;
}

export function vehicleHref(v: Vehicle): string {
  return `/vehicles/${v.slug}/`;
}

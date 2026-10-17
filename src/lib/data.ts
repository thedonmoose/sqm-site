import type { Vehicle } from "./types";
import fixtureJson from "../data/vehicles.fixture.json";

/**
 * Inventory source: Sanity CDN when SANITY_PROJECT_ID is set at build time,
 * otherwise the sample fixture. Dependency-free on purpose — plain fetch.
 */
const GROQ_QUERY = /* groq */ `*[_type == "vehicle"] | order(datePosted desc) {
  status, year, make, model, trim, vin, stockNumber,
  allInPrice, previousPrice, previousPriceAdvertised, mileageKm,
  bodyType, drivetrain, transmission, fuelType, engine,
  exteriorColour, interiorColour,
  "photos": photos[]{ "src": asset->url, alt, category },
  description, highlights, features,
  historyReportUrl, uvipAvailable, disclosures,
  "slug": slug.current, datePosted, dateSold
}`;

const SANITY_API_VERSION = "v2025-01-01";

interface SampleVehicleJson extends Omit<Vehicle, "datePosted" | "dateSold"> {
  daysAgoPosted: number;
  daysAgoSold?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function isoDaysAgo(days: number, today: Date): string {
  const utc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return new Date(utc - days * 86_400_000).toISOString().slice(0, 10);
}

function loadFixture(): Vehicle[] {
  // JSON literal inference keeps enums as plain strings; one controlled cast at the module boundary.
  const sample = fixtureJson as unknown as { vehicles: SampleVehicleJson[] };
  const today = new Date();
  return sample.vehicles.map(({ daysAgoPosted, daysAgoSold, ...vehicle }) => ({
    ...vehicle,
    datePosted: isoDaysAgo(daysAgoPosted, today),
    ...(daysAgoSold != null ? { dateSold: isoDaysAgo(daysAgoSold, today) } : {}),
  }));
}

/** Sanity portable text (array of blocks) to plain text; passes strings through. */
function toPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((block) => {
      const children = asRecord(block)?.children;
      if (!Array.isArray(children)) return "";
      return children.map((child) => {
        const text = asRecord(child)?.text;
        return typeof text === "string" ? text : "";
      }).join("");
    })
    .filter(Boolean)
    .join("\n\n");
}

function isVehicle(value: unknown): value is Vehicle {
  const v = asRecord(value);
  return (
    v !== null &&
    typeof v.slug === "string" &&
    typeof v.vin === "string" &&
    typeof v.allInPrice === "number" &&
    Array.isArray(v.photos) &&
    v.photos.length > 0
  );
}

function toVehicle(doc: unknown): Vehicle | null {
  if (!isVehicle(doc)) return null;
  return {
    ...doc,
    description: toPlainText(doc.description),
    highlights: Array.isArray(doc.highlights) ? doc.highlights : [],
    features: Array.isArray(doc.features) ? doc.features : [],
  };
}

export async function getVehicles(): Promise<Vehicle[]> {
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  if (!projectId) return loadFixture();

  const dataset = import.meta.env.SANITY_DATASET || "production";
  const url =
    `https://${projectId}.api.sanity.io/${SANITY_API_VERSION}/data/query/${dataset}` +
    `?query=${encodeURIComponent(GROQ_QUERY)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sanity inventory query failed with HTTP ${response.status}`);
  }
  const { result } = (await response.json()) as { result: unknown[] };
  return result.map(toVehicle).filter((v): v is Vehicle => v !== null);
}

/** Link target for "See similar vehicles": make filter when that make is in
 * stock, else body type, else plain inventory (spec §4.2). */
export function similarVehiclesHref(vehicle: Vehicle, all: Vehicle[]): string {
  const available = all.filter((v) => v.status !== "sold");
  if (available.some((v) => v.make === vehicle.make)) {
    return `/inventory/?make=${encodeURIComponent(vehicle.make)}`;
  }
  if (available.some((v) => v.bodyType === vehicle.bodyType)) {
    return `/inventory/?body=${encodeURIComponent(vehicle.bodyType)}`;
  }
  return "/inventory/";
}

/** Prefer same make, then same body type, then newest available (spec §4.4). */
export function pickRelated(vehicle: Vehicle, all: Vehicle[]): Vehicle[] {
  const pool = all
    .filter((candidate) => candidate.slug !== vehicle.slug && candidate.status === "available")
    .sort((a, b) => b.datePosted.localeCompare(a.datePosted));
  const ranked = [
    ...pool.filter((candidate) => candidate.make === vehicle.make),
    ...pool.filter((candidate) => candidate.bodyType === vehicle.bodyType),
    ...pool,
  ];
  const seen = new Set<string>();
  const out: Vehicle[] = [];
  for (const candidate of ranked) {
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    out.push(candidate);
    if (out.length === 3) break;
  }
  return out;
}

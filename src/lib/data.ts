import type { DescriptionBlock, DescriptionSpan, Vehicle } from "./types";
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
  "photos": photos[]{ "src": asset->url },
  description, highlights, features,
  historyReportUrl, uvipAvailable, disclosures,
  "slug": slug.current, datePosted, dateSold
}`;

const SANITY_API_VERSION = "v2025-01-01";

interface SampleVehicleJson extends Omit<Vehicle, "datePosted" | "dateSold" | "descriptionBlocks"> {
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
    descriptionBlocks: toDescriptionBlocks(vehicle.description),
    datePosted: isoDaysAgo(daysAgoPosted, today),
    ...(daysAgoSold != null ? { dateSold: isoDaysAgo(daysAgoSold, today) } : {}),
  }));
}

const BLOCK_STYLES: Record<string, true> = { normal: true, h1: true, h2: true, h3: true, h4: true, blockquote: true };
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:)/i;

function paragraphBlocks(text: string): DescriptionBlock[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p): DescriptionBlock => ({ style: "normal", level: 1, children: [{ text: p, marks: [] }], links: {} }));
}

/** Sanity portable text (or a plain string) to renderable blocks. Unknown shapes are dropped. */
export function toDescriptionBlocks(value: unknown): DescriptionBlock[] {
  if (typeof value === "string") return paragraphBlocks(value);
  if (!Array.isArray(value)) return [];
  const blocks: DescriptionBlock[] = [];
  for (const raw of value) {
    const block = asRecord(raw);
    if (!block || !Array.isArray(block.children)) continue;
    const links: Record<string, string> = {};
    if (Array.isArray(block.markDefs)) {
      for (const def of block.markDefs) {
        const d = asRecord(def);
        if (d && typeof d._key === "string" && typeof d.href === "string" && SAFE_HREF.test(d.href.trim())) {
          links[d._key] = d.href.trim();
        }
      }
    }
    const children: DescriptionSpan[] = [];
    for (const raw of block.children) {
      const child = asRecord(raw);
      if (!child || typeof child.text !== "string" || child.text === "") continue;
      const marks = Array.isArray(child.marks) ? child.marks.filter((m): m is string => typeof m === "string") : [];
      children.push({ text: child.text, marks });
    }
    if (children.length === 0) continue;
    const style = typeof block.style === "string" && Object.hasOwn(BLOCK_STYLES, block.style) ? block.style : "normal";
    blocks.push({
      style: style as DescriptionBlock["style"],
      ...(block.listItem === "bullet" || block.listItem === "number" ? { listItem: block.listItem } : {}),
      level: typeof block.level === "number" && block.level >= 1 ? Math.floor(block.level) : 1,
      children,
      links,
    });
  }
  return blocks;
}

/** Plain text for meta description, JSON-LD and the listing kit. */
export function descriptionToPlainText(blocks: DescriptionBlock[]): string {
  const counters: number[] = [];
  return blocks
    .map((block) => {
      const text = block.children.map((c) => c.text).join("");
      if (!block.listItem) {
        counters.length = 0;
        return text;
      }
      counters.length = block.level;
      for (let i = 0; i < block.level; i++) counters[i] ??= 0;
      if (block.listItem === "bullet") return `• ${text}`;
      counters[block.level - 1]++;
      return `${counters[block.level - 1]}. ${text}`;
    })
    .join("\n\n");
}

function isVehicle(value: unknown): value is Vehicle {
  const v = asRecord(value);
  return (
    v !== null &&
    typeof v.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug) &&
    typeof v.vin === "string" &&
    typeof v.allInPrice === "number" &&
    Array.isArray(v.photos) &&
    v.photos.length > 0
  );
}

function toVehicle(doc: unknown): Vehicle | null {
  if (!isVehicle(doc)) return null;
  const descriptionBlocks = toDescriptionBlocks(asRecord(doc)?.description);
  return {
    ...doc,
    // Studio enforces https, but documents written through the API skip Studio validation.
    historyReportUrl:
      typeof doc.historyReportUrl === "string" && doc.historyReportUrl.startsWith("https://")
        ? doc.historyReportUrl
        : undefined,
    description: descriptionToPlainText(descriptionBlocks),
    descriptionBlocks,
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

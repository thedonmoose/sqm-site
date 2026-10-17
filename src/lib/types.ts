/** Field names mirror the Sanity `vehicle` schema (spec §5) exactly. */

export interface Address {
  street: string;
  city: string;
  province: string;
  postal: string;
}

export interface HoursLine {
  days: string;
  hours: string;
}

export type VehicleStatus = "available" | "pending" | "sold";

export type BodyType =
  | "sedan"
  | "hatchback"
  | "coupe"
  | "suv"
  | "crossover"
  | "truck"
  | "van"
  | "wagon";

export type Drivetrain = "fwd" | "rwd" | "awd" | "4wd";

export type Transmission = "automatic" | "manual" | "cvt";

export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric" | "phev";

export type PhotoCategory = "exterior" | "interior";

export interface VehiclePhoto {
  src: string;
  alt: string;
  category: PhotoCategory;
}

export interface VehicleHighlight {
  title: string;
  detail: string;
}

export type DisclosureStatus = "none" | "disclosed";
export type OdometerStatus = "accurate" | "discrepancy";

export interface VehicleDisclosures {
  accidentOrDamageHistory: { status: DisclosureStatus; details?: string };
  rebuiltOrSalvageStatus: { status: DisclosureStatus; details?: string };
  odometerNote: { status: OdometerStatus; details?: string };
  soldAsCertified: boolean;
  certificationDetails?: string;
  otherDisclosures?: string;
}

export interface Vehicle {
  status: VehicleStatus;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  stockNumber?: string;
  allInPrice: number;
  previousPrice?: number;
  previousPriceAdvertised?: boolean;
  mileageKm: number;
  bodyType: BodyType;
  drivetrain: Drivetrain;
  transmission: Transmission;
  fuelType: FuelType;
  engine: string;
  exteriorColour: string;
  interiorColour: string;
  photos: VehiclePhoto[];
  description: string;
  highlights: VehicleHighlight[];
  features: string[];
  historyReportUrl?: string;
  uvipAvailable: boolean;
  disclosures: VehicleDisclosures;
  slug: string;
  /** ISO date (YYYY-MM-DD). */
  datePosted: string;
  dateSold?: string;
}

/** Sanity `review` document (optional). Only real reviews. */
export interface Review {
  quote: string;
  reviewerName: string;
  city?: string;
  rating: number;
  sourceUrl?: string;
  date?: string;
}

/** Sanity `siteSettings` singleton. */
export interface SiteSettings {
  businessName: string;
  registeredLegalName?: string;
  omvicRegistration: string;
  address: Address;
  phone?: string;
  phoneAcceptsTexts: boolean;
  textPhone?: string;
  email?: string;
  hours: HoursLine[];
  googleBusinessProfileUrl?: string;
  reviewRating?: number;
  reviewCount?: number;
  socialLinks: { label: string; url: string }[];
  defaultSeoText?: string;
  announcementBanner?: string;
  heroVideo?: {
    desktopMp4?: string;
    desktopWebm?: string;
    mobileMp4?: string;
    mobileWebm?: string;
    posterAvif?: string;
    posterWebp?: string;
  };
}

export type VehicleBadge = "Pending" | "Price reduced" | "Just arrived";

const DAY_MS = 86_400_000;

function parseDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

function todayUtc(today: Date): number {
  return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
}

function daysSince(iso: string, today: Date): number {
  return Math.round((todayUtc(today) - parseDay(iso)) / DAY_MS);
}

/** One badge per card, in priority order (spec §4.3). */
export function badgeFor(vehicle: Vehicle, today: Date): VehicleBadge | null {
  if (vehicle.status === "pending") return "Pending";
  if (
    vehicle.previousPrice != null &&
    vehicle.previousPrice > vehicle.allInPrice &&
    vehicle.previousPriceAdvertised === true
  ) {
    return "Price reduced";
  }
  const age = daysSince(vehicle.datePosted, today);
  if (age >= 0 && age <= 7) return "Just arrived";
  return null;
}

/** True when `status = sold` and `dateSold` is within the last `days` days. */
export function isSoldWithinDays(vehicle: Vehicle, days: number): boolean {
  if (vehicle.status !== "sold" || !vehicle.dateSold) return false;
  const age = daysSince(vehicle.dateSold, new Date());
  return age >= 0 && age <= days;
}

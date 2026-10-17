#!/usr/bin/env node
// Seeds the SQM dataset with the siteSettings singleton and 4 clearly-marked
// sample vehicles (including a placeholder photo so they pass validation).
//
// Usage:
//   node scripts/seed.mjs --project-id <id> [--dataset production]
//
// Token: reads SANITY_API_TOKEN from the environment (needs Editor access).

import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'
import {deflateSync} from 'node:zlib'

const args = process.argv.slice(2)

function argValue(flag) {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Seed the SQM Sanity dataset with site settings and 4 sample vehicles.

Usage:
  node scripts/seed.mjs --project-id <projectId> [--dataset <dataset>]

Options:
  --project-id <id>   Sanity project ID (falls back to SANITY_STUDIO_PROJECT_ID)
  --dataset <name>    Dataset name (falls back to SANITY_STUDIO_DATASET, default: production)
  --token <token>     API token (falls back to the SANITY_API_TOKEN env var)
  --help              Show this help

The token needs Editor permissions. Sample vehicles are prefixed with
"[SAMPLE VEHICLE — remove before launch]" and use the document IDs
sample-vehicle-s1001 … sample-vehicle-s1004, so re-running is safe and
removing them later is a single delete per document.`)
  process.exit(0)
}

const projectId = argValue('--project-id') ?? process.env.SANITY_STUDIO_PROJECT_ID ?? 'sqmplaceholder'
const dataset = argValue('--dataset') ?? process.env.SANITY_STUDIO_DATASET ?? 'production'
const token = argValue('--token') ?? process.env.SANITY_API_TOKEN

if (!token) {
  console.error('Error: a Sanity API token is required. Set SANITY_API_TOKEN or pass --token.')
  console.error('Create one at https://www.sanity.io/manage (project → API → Tokens, Editor role).')
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false})

function isoDate(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function block(text) {
  return {_type: 'block', _key: randomUUID(), style: 'normal', markDefs: [], children: [{_type: 'span', _key: randomUUID(), text, marks: []}]}
}

function photo(assetId, alt, category = 'exterior') {
  return {_type: 'vehiclePhoto', _key: randomUUID(), asset: {_type: 'reference', _ref: assetId}, alt, category}
}

function okDisclosures() {
  return {
    _type: 'object',
    accidentOrDamageHistory: {_type: 'disclosureItem', status: 'none'},
    rebuiltOrSalvageStatus: {_type: 'disclosureItem', status: 'none'},
    odometerNote: {_type: 'object', status: 'accurate'},
    soldAsCertified: false,
  }
}

function disclosedAccident(details) {
  return {
    ...okDisclosures(),
    accidentOrDamageHistory: {_type: 'disclosureItem', status: 'disclosed', details},
  }
}

// Minimal solid-colour PNG encoder (no dependencies) so sample vehicles pass
// the "at least one photo" validation before real photos are imported.
async function uploadPlaceholderPhoto() {
  const width = 1600
  const height = 1200
  const [r, g, b] = [0x27, 0x25, 0x25] // SQM charcoal
  const row = Buffer.alloc(1 + width * 3)
  row[0] = 0
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r
    row[1 + x * 3 + 1] = g
    row[1 + x * 3 + 2] = b
  }
  const raw = Buffer.concat(Array.from({length: height}, () => row))
  const crc32 = (buf) => {
    let table = crc32.table
    if (!table) {
      table = crc32.table = new Int32Array(256)
      for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        table[n] = c
      }
    }
    let crc = -1
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    return (crc ^ -1) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, {level: 9})),
    chunk('IEND', Buffer.alloc(0)),
  ])
  const asset = await client.assets.upload('image', png, {
    filename: 'sample-vehicle-placeholder.png',
    contentType: 'image/png',
  })
  return asset._id
}

const SAMPLE_PREFIX = '[SAMPLE VEHICLE — remove before launch] '

const sampleVehicles = [
  {
    _id: 'sample-vehicle-s1001',
    status: 'available',
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    trim: 'EX',
    vin: '1HGCV1F34LA000001',
    stockNumber: 'S-1001',
    allInPrice: 19995,
    mileageKm: 62000,
    bodyType: 'sedan',
    drivetrain: 'fwd',
    transmission: 'automatic',
    fuelType: 'gasoline',
    engine: '1.5L turbocharged 4-cylinder',
    exteriorColour: 'Modern Steel Metallic',
    interiorColour: 'Black',
    description: [block(SAMPLE_PREFIX + 'Clean local vehicle in excellent condition. Runs and drives well, cold air conditioning, all power equipment working. Book a test drive — this one will not last long.')],
    highlights: [
      {title: 'New tires', detail: 'Installed 2025-11'},
      {title: 'Fresh service', detail: 'Oil and filter changed 2026-01'},
    ],
    features: ['Backup camera', 'Heated front seats', 'Apple CarPlay and Android Auto', 'Sunroof', 'Bluetooth', 'Lane-keeping assist'],
    uvipAvailable: true,
    disclosures: okDisclosures(),
    slug: {_type: 'slug', current: '2019-honda-civic-ex'},
    datePosted: isoDate(-2),
  },
  {
    _id: 'sample-vehicle-s1002',
    status: 'available',
    year: 2021,
    make: 'Toyota',
    model: 'RAV4',
    trim: 'LE',
    vin: '2T3W1RFV8MW000002',
    stockNumber: 'S-1002',
    allInPrice: 27495,
    previousPrice: 28995,
    previousPriceAdvertised: true,
    mileageKm: 48500,
    bodyType: 'suv',
    drivetrain: 'awd',
    transmission: 'cvt',
    fuelType: 'gasoline',
    engine: '2.5L 4-cylinder',
    exteriorColour: 'Blueprint',
    interiorColour: 'Black',
    description: [block(SAMPLE_PREFIX + 'One-owner SUV with Toyota safety sense, backup camera and plenty of cargo room. Accident history is disclosed below and supported by the Carfax report.')],
    features: ['All-wheel drive', 'Backup camera', 'Toyota Safety Sense 2.0', 'Bluetooth', 'Roof rails', 'Heated mirrors'],
    uvipAvailable: false,
    disclosures: disclosedAccident('Low-speed rear impact in 2023. Rear bumper was repaired and repainted; invoices are on file and the repair is shown on the Carfax report.'),
    slug: {_type: 'slug', current: '2021-toyota-rav4-le'},
    datePosted: isoDate(-20),
  },
  {
    _id: 'sample-vehicle-s1003',
    status: 'sold',
    year: 2017,
    make: 'Ford',
    model: 'F-150',
    trim: 'XLT SuperCrew',
    vin: '1FTEW1CP7HK000003',
    stockNumber: 'S-1003',
    allInPrice: 24900,
    mileageKm: 118000,
    bodyType: 'truck',
    drivetrain: '4wd',
    transmission: 'automatic',
    fuelType: 'gasoline',
    engine: '3.5L V6',
    exteriorColour: 'Shadow Black',
    interiorColour: 'Medium Earth Gray',
    description: [block(SAMPLE_PREFIX + 'SuperCrew 4x4 with tow package and spray-in bedliner. Work truck trim, well maintained with service records.')],
    features: ['4x4', 'Tow package', 'Spray-in bedliner', 'Bluetooth', 'Backup camera', 'Trailer brake controller'],
    uvipAvailable: true,
    disclosures: okDisclosures(),
    slug: {_type: 'slug', current: '2017-ford-f150-xlt'},
    datePosted: isoDate(-45),
    dateSold: isoDate(-12),
  },
  {
    _id: 'sample-vehicle-s1004',
    status: 'available',
    year: 2020,
    make: 'Hyundai',
    model: 'Elantra',
    trim: 'Preferred',
    vin: '5NPE34AF4HH000004',
    stockNumber: 'S-1004',
    allInPrice: 17895,
    mileageKm: 74300,
    bodyType: 'sedan',
    drivetrain: 'fwd',
    transmission: 'automatic',
    fuelType: 'gasoline',
    engine: '2.0L 4-cylinder',
    exteriorColour: 'Polar White',
    interiorColour: 'Black',
    description: [block(SAMPLE_PREFIX + 'Fuel-efficient commuter car with heated seats and steering wheel, Apple CarPlay and remaining Hyundai warranty coverage.')],
    features: ['Heated seats', 'Heated steering wheel', 'Apple CarPlay and Android Auto', 'Backup camera', 'Blind-spot monitoring', 'Bluetooth'],
    uvipAvailable: false,
    disclosures: okDisclosures(),
    slug: {_type: 'slug', current: '2020-hyundai-elantra-preferred'},
    datePosted: isoDate(-9),
  },
]

console.log(`Seeding project "${projectId}" dataset "${dataset}"…`)

console.log('Uploading placeholder photo…')
const placeholderAssetId = await uploadPlaceholderPhoto()
console.log(`  asset: ${placeholderAssetId}`)

const siteSettings = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  businessName: 'Serene Quality Motors',
  omvicRegistration: '5923529',
  address: '4650 Kingston Rd, Scarborough, ON M1E 2P9',
}
await client.createIfNotExists(siteSettings)
console.log('Created siteSettings if missing (fill in phone, email and hours in the Studio, then publish).')

for (const vehicle of sampleVehicles) {
  const doc = {
    ...vehicle,
    _type: 'vehicle',
    staffInstructions: undefined,
    photos: [photo(placeholderAssetId, 'Placeholder photo — replace with real photos of this vehicle')],
  }
  await client.createIfNotExists(doc)
  console.log(`Seeded ${vehicle._id}: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.status})`)
}

console.log('Done. Sample vehicles are clearly marked — delete them before launch.')

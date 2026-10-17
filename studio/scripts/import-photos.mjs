#!/usr/bin/env node
// Imports vehicle photos from a folder tree into Sanity as DRAFTS for staff review.
//
// Folder convention:
//   <root>/<stockNumber or VIN>/*.jpg|jpeg|png|webp|avif|gif
//   - one subfolder per vehicle, named by its stock number or VIN (case-insensitive)
//   - files are added to the photos array in filename order
//   - a filename containing "interior" (case-insensitive) becomes an Interior
//     photo; everything else becomes an Exterior photo
//
// Usage:
//   node scripts/import-photos.mjs --dir ./photos --project-id <id> [--dry-run]

import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'
import {createReadStream} from 'node:fs'
import {readdir, stat} from 'node:fs/promises'
import {basename, join} from 'node:path'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

const args = process.argv.slice(2)

function argValue(flag) {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Import vehicle photos into Sanity as drafts for staff review.

Usage:
  node scripts/import-photos.mjs --dir <root folder> --project-id <projectId> [options]

Folder convention:
  <root>/<stock number or VIN>/<files>
  - one subfolder per vehicle, named by its stock number or VIN (case-insensitive)
  - files are appended to the vehicle's photos in filename order
    (1.jpg, 2.jpg, … or any names sorted alphabetically)
  - a filename containing "interior" (e.g. dash-interior-3.jpg) is uploaded as
    an Interior photo; all others are Exterior

Options:
  --dir <path>        Root folder containing one subfolder per vehicle (required)
  --project-id <id>   Sanity project ID (falls back to SANITY_STUDIO_PROJECT_ID)
  --dataset <name>    Dataset (falls back to SANITY_STUDIO_DATASET, default: production)
  --token <token>     API token (falls back to the SANITY_API_TOKEN env var)
  --dry-run           Show what would happen without uploading or writing
  --help              Show this help

Notes:
  - Changes are written to the DRAFT version of each vehicle so staff can
    review alt text and ordering before publishing.
  - Running the script twice adds duplicate photos — re-run only for new folders.
`)
  process.exit(0)
}

const dir = argValue('--dir')
const projectId = argValue('--project-id') ?? process.env.SANITY_STUDIO_PROJECT_ID ?? 'sqmplaceholder'
const dataset = argValue('--dataset') ?? process.env.SANITY_STUDIO_DATASET ?? 'production'
const token = argValue('--token') ?? process.env.SANITY_API_TOKEN
const dryRun = args.includes('--dry-run')

if (!dir) {
  console.error('Error: --dir is required. See --help for usage.')
  process.exit(1)
}
if (!token) {
  console.error('Error: a Sanity API token is required. Set SANITY_API_TOKEN or pass --token.')
  process.exit(1)
}

const dirStat = await stat(dir).catch(() => null)
if (!dirStat?.isDirectory()) {
  console.error(`Error: "${dir}" is not a folder. See --help for usage.`)
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false})
const filenameOrder = new Intl.Collator('en', {numeric: true, sensitivity: 'base'})

async function findVehicle(key) {
  const query = `*[!(_id in path("drafts.**")) && _type == "vehicle" && (lower(vin) == $key || lower(stockNumber) == $key)][0]{_id, year, make, model, trim}`
  return client.fetch(query, {key: key.toLowerCase()})
}

function humanizeFilename(filename, vehicle) {
  const cleaned = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const vehicleName = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')
  return `${vehicleName} — ${cleaned}`
}

async function importFolder(subfolderName) {
  const folderPath = join(dir, subfolderName)
  const folderStat = await stat(folderPath)
  if (!folderStat.isDirectory()) {
    console.warn(`Skipping ${subfolderName}: not a folder.`)
    return
  }

  const vehicle = await findVehicle(subfolderName)
  if (!vehicle) {
    console.warn(`Skipping ${subfolderName}/: no vehicle found with this stock number or VIN.`)
    return
  }
  const vehicleName = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')

  const files = (await readdir(folderPath))
    .filter((name) => {
      const dot = name.lastIndexOf('.')
      return dot !== -1 && IMAGE_EXTENSIONS.has(name.slice(dot).toLowerCase())
    })
    .sort(filenameOrder.compare)
  if (files.length === 0) {
    console.warn(`Skipping ${subfolderName}/: no image files found.`)
    return
  }

  console.log(`${subfolderName}/ → ${vehicleName} (${vehicle._id}): ${files.length} photo(s)`)

  const draftId = `drafts.${vehicle._id}`
  const base = (await client.getDocument(draftId)) ?? (await client.getDocument(vehicle._id))
  if (!base) {
    console.warn(`Skipping ${subfolderName}/: vehicle document not readable.`)
    return
  }

  const newPhotos = []
  for (const filename of files) {
    const category = /interior/i.test(filename) ? 'interior' : 'exterior'
    const alt = humanizeFilename(filename, vehicle)
    console.log(`  ${category.padEnd(8)} ${filename}`)
    if (dryRun) {
      continue
    }
    const asset = await client.assets.upload('image', createReadStream(join(folderPath, filename)), {
      filename,
    })
    newPhotos.push({
      _type: 'vehiclePhoto',
      _key: randomUUID(),
      asset: {_type: 'reference', _ref: asset._id},
      alt,
      category,
    })
  }

  if (dryRun) {
    console.log(`  dry run: no changes written.`)
    return
  }

  // Write to the draft so nothing goes live without staff review.
  await client.createOrReplace({...base, _id: draftId, photos: [...(base.photos ?? []), ...newPhotos]})
  console.log(`  saved as draft (${newPhotos.length} photo(s) appended).`)
}

const entries = (await readdir(dir)).sort(filenameOrder.compare)
if (entries.length === 0) {
  console.warn(`No subfolders found in "${dir}".`)
  process.exit(0)
}

for (const entry of entries) {
  await importFolder(entry)
}
console.log(dryRun ? 'Dry run complete.' : 'Import complete. Review the drafts in the Studio, then publish.')

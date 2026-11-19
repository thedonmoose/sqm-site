#!/usr/bin/env node
// One-off: converts legacy disclosures.soldAsCertified (boolean) to disclosures.saleStatus
// and drops the retired certificationDetails field.
// Usage: SANITY_TOKEN=... node scripts/migrate-sale-status.mjs --project-id <id> [--dataset production] [--dry-run]
import {createClient} from '@sanity/client'

const args = process.argv.slice(2)
const arg = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)
const dryRun = args.includes('--dry-run')
const client = createClient({
  projectId: arg('--project-id'),
  dataset: arg('--dataset') || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
})

const docs = await client.fetch(
  `*[_type == "vehicle" && defined(disclosures) && !defined(disclosures.saleStatus)]{_id, disclosures}`,
)
console.log(`${docs.length} document(s) to migrate${dryRun ? ' (dry run)' : ''}`)
for (const doc of docs) {
  const saleStatus = doc.disclosures.soldAsCertified === true ? 'certified' : 'as-is'
  console.log(`${doc._id}: ${saleStatus}`)
  if (dryRun) continue
  await client
    .patch(doc._id)
    .set({'disclosures.saleStatus': saleStatus})
    .unset(['disclosures.soldAsCertified', 'disclosures.certificationDetails'])
    .commit()
}

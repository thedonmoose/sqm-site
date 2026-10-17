import {defineArrayMember, defineField, defineType} from 'sanity'
import type {SanityDocument} from 'sanity'

const today = () => new Date().toISOString().slice(0, 10)

const STAFF_HELP =
  'HOW TO ADD A VEHICLE\n' +
  '1. Fill in the details below. Fields marked with * must be filled in before the vehicle can be published.\n' +
  '2. Add at least one photo. Drag photos to reorder — the first one is the cover photo shown everywhere on the site.\n' +
  '3. Answer every question in the Vehicle disclosures section at the bottom — Ontario law (OMVIC) requires this.\n' +
  '4. Press Publish. The car appears on the website within a few minutes.\n' +
  'When a car sells, use the "Mark as sold" button at the top of this page. Full instructions are in STAFF-GUIDE.md.'

const bodyTypeOptions = [
  {title: 'Sedan', value: 'sedan'},
  {title: 'Hatchback', value: 'hatchback'},
  {title: 'Coupe', value: 'coupe'},
  {title: 'SUV', value: 'suv'},
  {title: 'Crossover', value: 'crossover'},
  {title: 'Truck', value: 'truck'},
  {title: 'Van', value: 'van'},
  {title: 'Wagon', value: 'wagon'},
]

const drivetrainOptions = [
  {title: 'FWD (front-wheel drive)', value: 'fwd'},
  {title: 'RWD (rear-wheel drive)', value: 'rwd'},
  {title: 'AWD (all-wheel drive)', value: 'awd'},
  {title: '4WD (four-wheel drive)', value: '4wd'},
]

const transmissionOptions = [
  {title: 'Automatic', value: 'automatic'},
  {title: 'Manual', value: 'manual'},
  {title: 'CVT', value: 'cvt'},
]

const fuelTypeOptions = [
  {title: 'Gasoline', value: 'gasoline'},
  {title: 'Diesel', value: 'diesel'},
  {title: 'Hybrid', value: 'hybrid'},
  {title: 'Electric', value: 'electric'},
  {title: 'Plug-in hybrid', value: 'phev'},
]

export default defineType({
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    defineField({
      name: 'staffInstructions',
      title: 'Read me first',
      type: 'text',
      rows: 6,
      readOnly: true,
      initialValue: STAFF_HELP,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Available', value: 'available'},
          {title: 'Pending', value: 'pending'},
          {title: 'Sold', value: 'sold'},
        ],
        layout: 'radio',
      },
      initialValue: 'available',
      validation: (Rule) => Rule.required().error('Status is required.'),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(1950)
          .max(new Date().getFullYear() + 2)
          .error('Enter a valid model year.'),
    }),
    defineField({
      name: 'make',
      title: 'Make',
      type: 'string',
      validation: (Rule) => Rule.required().error('Make is required.'),
    }),
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
      validation: (Rule) => Rule.required().error('Model is required.'),
    }),
    defineField({
      name: 'trim',
      title: 'Trim',
      type: 'string',
      description: 'Optional, e.g. EX, LE, XLT, Preferred.',
    }),
    defineField({
      name: 'vin',
      title: 'VIN',
      type: 'string',
      description: '17-character vehicle identification number. Publishing is blocked until this is correct.',
      validation: (Rule) =>
        Rule.required()
          .length(17)
          .error('The VIN must be exactly 17 characters. Publishing is blocked until it is.'),
    }),
    defineField({
      name: 'stockNumber',
      title: 'Stock number',
      type: 'string',
      description: 'Optional. Also used to match photo folders when importing photos.',
    }),
    defineField({
      name: 'allInPrice',
      title: 'All-in price (CAD)',
      type: 'number',
      description:
        'This price must include ALL fees except HST and licensing, per OMVIC advertising rules. Publishing is blocked without it.',
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .error('The all-in price is required and publishing is blocked without it.'),
    }),
    defineField({
      name: 'previousPrice',
      title: 'Previous price (CAD)',
      type: 'number',
      description:
        'Only fill this in when lowering the price: move the old price here and enter the new price above. Must be higher than the all-in price.',
      validation: (Rule) =>
        Rule.custom((previousPrice, context) => {
          const doc = context.document as {allInPrice?: number} | undefined
          if (typeof previousPrice === 'number' && typeof doc?.allInPrice === 'number' && previousPrice <= doc.allInPrice) {
            return 'The previous price must be higher than the current all-in price.'
          }
          return true
        }),
    }),
    defineField({
      name: 'previousPriceAdvertised',
      title: 'This previous price was genuinely advertised',
      type: 'boolean',
      description:
        'OMVIC rule: a struck-through previous price may only be shown if that price was genuinely advertised. Tick only if true.',
      validation: (Rule) =>
        Rule.custom((advertised, context) => {
          const doc = context.document as {previousPrice?: number} | undefined
          if (typeof doc?.previousPrice === 'number' && advertised !== true) {
            return 'You must confirm this when entering a previous price. Only tick it if that price was genuinely advertised.'
          }
          return true
        }),
    }),
    defineField({
      name: 'mileageKm',
      title: 'Mileage (km)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).error('Mileage is required.'),
    }),
    defineField({
      name: 'bodyType',
      title: 'Body type',
      type: 'string',
      options: {list: bodyTypeOptions},
      validation: (Rule) => Rule.required().error('Body type is required.'),
    }),
    defineField({
      name: 'drivetrain',
      title: 'Drivetrain',
      type: 'string',
      options: {list: drivetrainOptions},
      validation: (Rule) => Rule.required().error('Drivetrain is required.'),
    }),
    defineField({
      name: 'transmission',
      title: 'Transmission',
      type: 'string',
      options: {list: transmissionOptions},
      validation: (Rule) => Rule.required().error('Transmission is required.'),
    }),
    defineField({
      name: 'fuelType',
      title: 'Fuel type',
      type: 'string',
      options: {list: fuelTypeOptions},
      validation: (Rule) => Rule.required().error('Fuel type is required.'),
    }),
    defineField({
      name: 'engine',
      title: 'Engine',
      type: 'string',
      description: 'e.g. "2.0L 4-cylinder", "3.5L V6".',
    }),
    defineField({
      name: 'exteriorColour',
      title: 'Exterior colour',
      type: 'string',
    }),
    defineField({
      name: 'interiorColour',
      title: 'Interior colour',
      type: 'string',
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [defineArrayMember({type: 'vehiclePhoto'})],
      description: 'At least one photo is required. Drag to reorder — the first photo is the cover.',
      options: {
        layout: 'grid',
      },
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .error('At least one photo is required. Publishing is blocked until a photo is added.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
      description: 'Shown under the photo gallery on the vehicle page.',
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({name: 'detail', title: 'Detail', type: 'string'}),
          ],
          preview: {
            select: {title: 'title', subtitle: 'detail'},
          },
        }),
      ],
      description: 'Optional — work done or notable points, e.g. "New tires: installed 2025-11". Max 6.',
      validation: (Rule) => Rule.max(6).error('Maximum 6 highlights.'),
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      description: 'Equipment list, e.g. "Heated seats". Shown in two columns on the vehicle page.',
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'historyReportUrl',
      title: 'History report URL',
      type: 'url',
      description: 'Carfax or equivalent report link.',
      validation: (Rule) => Rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'uvipAvailable',
      title: 'UVIP available',
      type: 'boolean',
      description: 'Tick if a Used Vehicle Information Package is available for this vehicle.',
    }),
    defineField({
      name: 'disclosures',
      title: 'Vehicle disclosures (required)',
      type: 'object',
      description:
        'Ontario law (OMVIC) requires these to be answered for every vehicle. Every question must be answered before publishing — no blanks.',
      options: {
        collapsed: false,
      },
      fields: [
        defineField({
          name: 'accidentOrDamageHistory',
          title: 'Accident or damage history',
          type: 'disclosureItem',
        }),
        defineField({
          name: 'rebuiltOrSalvageStatus',
          title: 'Rebuilt or salvage status',
          type: 'disclosureItem',
        }),
        defineField({
          name: 'odometerNote',
          title: 'Odometer',
          type: 'object',
          fields: [
            defineField({
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  {title: 'Accurate', value: 'accurate'},
                  {title: 'Discrepancy disclosed', value: 'discrepancy'},
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required().error('Choose Accurate or Discrepancy disclosed.'),
            }),
            defineField({
              name: 'details',
              title: 'Details',
              type: 'text',
              rows: 3,
              description: 'Required when a discrepancy is disclosed.',
              validation: (Rule) =>
                Rule.custom((details, context) => {
                  const parent = context.parent as {status?: string} | undefined
                  if (parent?.status === 'discrepancy' && !details) {
                    return 'Details are required when a discrepancy is disclosed.'
                  }
                  return true
                }),
            }),
          ],
        }),
        defineField({
          name: 'soldAsCertified',
          title: 'Sold as certified',
          type: 'boolean',
          description: 'Only tick if the vehicle is actually sold certified. Never claim certification you cannot document.',
        }),
        defineField({
          name: 'certificationDetails',
          title: 'Certification details',
          type: 'string',
          description: 'Required when the vehicle is sold as certified — what the certification covers and who issued it.',
          validation: (Rule) =>
            Rule.custom((details, context) => {
              const doc = context.document as {
                disclosures?: {soldAsCertified?: boolean}
              } | undefined
              if (doc?.disclosures?.soldAsCertified === true && !details) {
                return 'Certification details are required when the vehicle is sold as certified.'
              }
              return true
            }),
        }),
        defineField({
          name: 'otherDisclosures',
          title: 'Other disclosures',
          type: 'text',
          rows: 3,
          description: 'Optional — anything else a buyer should know.',
        }),
      ],
      validation: (Rule) =>
        Rule.custom((disclosures) => {
          const d = disclosures as
            | {
                accidentOrDamageHistory?: {status?: string}
                rebuiltOrSalvageStatus?: {status?: string}
                odometerNote?: {status?: string}
                soldAsCertified?: boolean
              }
            | undefined
          if (!d) {
            return 'Vehicle disclosures are required. Publishing is blocked until every question is answered.'
          }
          const missing: string[] = []
          if (!d.accidentOrDamageHistory?.status) missing.push('accident or damage history')
          if (!d.rebuiltOrSalvageStatus?.status) missing.push('rebuilt/salvage status')
          if (!d.odometerNote?.status) missing.push('odometer')
          if (typeof d.soldAsCertified !== 'boolean') missing.push('sold as certified')
          if (missing.length > 0) {
            return `Disclosures must be answered explicitly — missing: ${missing.join(', ')}.`
          }
          return true
        }),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The web address for this vehicle. Press "Generate" to fill it in automatically.',
      options: {
        source: (doc: SanityDocument) =>
          [doc.year, doc.make, doc.model, doc.trim, doc.stockNumber].filter(Boolean).join(' '),
        slugify: (input: string) =>
          input
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required().error('A slug is required — it becomes the vehicle page URL.'),
    }),
    defineField({
      name: 'datePosted',
      title: 'Date posted',
      type: 'date',
      description: 'Defaults to today. Drives the "Just arrived" badge on the website.',
      initialValue: () => today(),
    }),
    defineField({
      name: 'dateSold',
      title: 'Date sold',
      type: 'date',
      description: 'Set automatically by the "Mark as sold" button. Required once the status is Sold.',
      validation: (Rule) =>
        Rule.custom((dateSold, context) => {
          const doc = context.document as {status?: string} | undefined
          if (doc?.status === 'sold' && !dateSold) {
            return 'Date sold is required when the status is Sold.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      year: 'year',
      make: 'make',
      model: 'model',
      trim: 'trim',
      status: 'status',
      price: 'allInPrice',
      media: 'photos.0.asset',
    },
    prepare: ({year, make, model, trim, status, price, media}) => ({
      title: [year, make, model, trim].filter(Boolean).join(' '),
      subtitle: [status, price ? `$${price.toLocaleString('en-CA')}` : 'no price set'].filter(Boolean).join(' · '),
      media,
    }),
  },
})

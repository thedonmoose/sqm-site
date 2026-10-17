import {defineField, defineType} from 'sanity'

// Shared shape for accident/damage history and rebuilt/salvage status.
// The odometer note has its own status options, so it is defined inline on the vehicle.
export default defineType({
  name: 'disclosureItem',
  title: 'Disclosure',
  type: 'object',
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Disclosed', value: 'disclosed'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required().error('Choose None or Disclosed — this must be answered for every vehicle.'),
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'text',
      rows: 3,
      description: 'Required when the status is "Disclosed". Explain what happened in plain language.',
      validation: (Rule) =>
        Rule.custom((details, context) => {
          const parent = context.parent as {status?: string} | undefined
          if (parent?.status === 'disclosed' && !details) {
            return 'Details are required when the status is "Disclosed".'
          }
          return true
        }),
    }),
  ],
})

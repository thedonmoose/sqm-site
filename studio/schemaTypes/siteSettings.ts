import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'businessName',
      title: 'Business name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'omvicRegistration',
      title: 'OMVIC registration number',
      type: 'string',
      initialValue: '5923529',
      description: 'Shown in the footer and on the home page. Ontario law requires it.',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
      initialValue: '4650 Kingston Rd, Scarborough, ON M1E 2P9',
    }),
    defineField({
      name: 'phone',
      title: 'Phone number',
      type: 'string',
      description: 'Shown on call buttons across the site.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'phoneAcceptsTexts',
      title: 'This phone number accepts texts',
      type: 'boolean',
      description: 'When ticked, the website shows "Text us" links.',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'string',
      description: 'e.g. "Mon–Fri 9am–6pm, Sat 10am–4pm".',
    }),
    defineField({
      name: 'googleBusinessProfileUrl',
      title: 'Google Business Profile URL',
      type: 'url',
      validation: (Rule) => Rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'reviewRating',
      title: 'Google review rating',
      type: 'number',
      description: 'Updated by hand until a reviews integration is added.',
      validation: (Rule) => Rule.min(0).max(5),
    }),
    defineField({
      name: 'reviewCount',
      title: 'Google review count',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'platform', title: 'Platform', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required().uri({scheme: ['https']}),
            }),
          ],
          preview: {
            select: {title: 'platform', subtitle: 'url'},
          },
        }),
      ],
    }),
    defineField({
      name: 'defaultSeoText',
      title: 'Default SEO text',
      type: 'text',
      description: 'Fallback meta description for pages without their own.',
    }),
    defineField({
      name: 'announcementBanner',
      title: 'Announcement banner',
      type: 'string',
      description: 'Optional. Leave empty for no banner.',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Site settings'}),
  },
})

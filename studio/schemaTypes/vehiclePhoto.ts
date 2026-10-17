import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'vehiclePhoto',
  title: 'Photo',
  type: 'image',
  options: {
    hotspot: true,
  },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the photo for screen readers, e.g. "Front three-quarter view, seen from the driver side".',
      validation: (Rule) => Rule.required().error('Every photo needs alt text.'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Exterior photos show the outside; interior photos show the cabin, dash or engine bay style shots shown on the Interior tab.',
      options: {
        list: [
          {title: 'Exterior', value: 'exterior'},
          {title: 'Interior', value: 'interior'},
        ],
        layout: 'radio',
      },
      initialValue: 'exterior',
    }),
  ],
  preview: {
    select: {title: 'alt', category: 'category', media: 'asset'},
    prepare: ({title, category, media}) => ({title: title || 'Photo', subtitle: category || 'exterior', media}),
  },
})

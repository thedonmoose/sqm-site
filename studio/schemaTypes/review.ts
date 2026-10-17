import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'Only real reviews, and only used with the customer’s permission.',
      validation: (Rule) => Rule.required().error('The review quote is required.'),
    }),
    defineField({
      name: 'reviewerName',
      title: 'Reviewer name',
      type: 'string',
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'sourceLink',
      title: 'Source link',
      type: 'url',
      description: 'Link to the original review (e.g. Google), if public.',
      validation: (Rule) => Rule.uri({scheme: ['https']}),
    }),
  ],
  preview: {
    select: {quote: 'quote', reviewerName: 'reviewerName', rating: 'rating'},
    prepare: ({quote, reviewerName, rating}) => ({
      title: quote ? `${quote.slice(0, 60)}${quote.length > 60 ? '…' : ''}` : 'Untitled review',
      subtitle: [reviewerName, rating ? `${rating}★` : null].filter(Boolean).join(' · '),
    }),
  },
})

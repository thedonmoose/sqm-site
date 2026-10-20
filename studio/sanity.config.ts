import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemaTypes'
import markAsAvailable from './documentActions/markAsAvailable'
import markAsSold from './documentActions/markAsSold'

export default defineConfig({
  name: 'default',
  title: 'Serene Quality Motors',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'e15y8b3s',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Serene Quality Motors')
          .items([
            S.listItem()
              .title('Site settings')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            S.documentTypeListItem('vehicle').title('Vehicles'),
            S.documentTypeListItem('review').title('Reviews'),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    newDocumentOptions: (prev) => prev.filter((item) => item.templateId !== 'siteSettings'),
    actions: (prev, context) => {
      if (context.schemaType !== 'vehicle') {
        return prev
      }
      return [...prev, markAsSold, markAsAvailable]
    },
  },
})

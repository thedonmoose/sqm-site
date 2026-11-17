import {defineType} from 'sanity'

export default defineType({
  name: 'vehiclePhoto',
  title: 'Photo',
  type: 'image',
  options: {
    hotspot: true,
  },
})

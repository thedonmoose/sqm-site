import {useCallback} from 'react'
import {useDocumentOperation} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

const markAsAvailable: DocumentActionComponent = (props: DocumentActionProps) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)

  const doc = (props.draft ?? props.published) as {status?: string} | undefined
  if (props.type !== 'vehicle' || !doc || doc.status !== 'sold') {
    return null
  }

  return {
    label: 'Mark as available',
    tone: 'positive',
    onHandle: useCallback(() => {
      patch.execute([{set: {status: 'available'}}, {unset: ['dateSold']}])
      publish.execute()
      props.onComplete()
    }, [patch, publish, props]),
  }
}

export default markAsAvailable

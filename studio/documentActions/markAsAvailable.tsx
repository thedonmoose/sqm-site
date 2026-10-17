import {useCallback, useState} from 'react'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {useDocumentOperation, useValidationStatus} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

const markAsAvailable: DocumentActionComponent = (props: DocumentActionProps) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const validation = useValidationStatus(props.id, props.type, true)
  const hasErrors = validation.validation.some((marker) => marker.level === 'error')
  const [publishBlocker, setPublishBlocker] = useState<string | null>(null)

  const doc = (props.draft ?? props.published) as {status?: string} | undefined
  const onHandle = useCallback(() => {
    if (hasErrors) {
      setPublishBlocker(
        validation.validation.find((marker) => marker.level === 'error')?.message ??
          'This vehicle has validation errors.',
      )
      return
    }
    patch.execute([{set: {status: 'available'}}, {unset: ['dateSold']}])
    publish.execute()
    props.onComplete()
  }, [hasErrors, patch, props, publish, validation.validation])

  if (props.type !== 'vehicle' || !doc || (doc.status !== 'sold' && !publishBlocker)) {
    return null
  }

  return {
    label: 'Mark as available',
    tone: 'positive',
    onHandle,
    dialog: publishBlocker
      ? {
          type: 'dialog',
          header: 'Unable to mark this vehicle as available',
          onClose: () => {
            setPublishBlocker(null)
            props.onComplete()
          },
          content: (
            <Stack gap={4} padding={4}>
              <Text>
                The status was not updated or published because this vehicle has a validation error. Resolve the issue,
                then try again. Reason: <strong>{publishBlocker}</strong>.
              </Text>
              <Flex justify="flex-end">
                <Button
                  text="Close"
                  mode="ghost"
                  onClick={() => {
                    setPublishBlocker(null)
                    props.onComplete()
                  }}
                />
              </Flex>
            </Stack>
          ),
        }
      : null,
  }
}

export default markAsAvailable


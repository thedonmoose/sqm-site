import {useCallback, useState} from 'react'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {useDocumentOperation, useValidationStatus} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

const markAsSold: DocumentActionComponent = (props: DocumentActionProps) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const validation = useValidationStatus(props.id, props.type, true)
  const hasErrors = validation.validation.some((marker) => marker.level === 'error')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [publishBlocker, setPublishBlocker] = useState<string | null>(null)

  const doc = (props.draft ?? props.published) as {status?: string} | undefined
  const onConfirm = useCallback(() => {
    if (hasErrors) {
      setPublishBlocker(
        validation.validation.find((marker) => marker.level === 'error')?.message ??
          'This vehicle has validation errors.',
      )
      return
    }
    patch.execute([
      {
        set: {
          status: 'sold',
          dateSold: new Date().toISOString().slice(0, 10),
        },
      },
    ])
    publish.execute()
    setConfirmOpen(false)
    props.onComplete()
  }, [hasErrors, patch, props, publish, validation.validation])

  if (props.type !== 'vehicle' || !doc || (doc.status === 'sold' && !publishBlocker)) {
    return null
  }

  return {
    label: 'Mark as sold',
    tone: 'critical',
    onHandle: () => setConfirmOpen(true),
    dialog: confirmOpen && {
      type: 'dialog',
      header: 'Mark this vehicle as sold?',
      onClose: () => {
        setConfirmOpen(false)
        setPublishBlocker(null)
      },
      content: (
        <Stack gap={4} padding={4}>
          <Text>
            This sets the status to <strong>Sold</strong> and the date sold to today, then publishes the vehicle. It
            moves to the "Recently sold" section of the website on the next update, and you can still edit it
            afterwards.
          </Text>
          {publishBlocker && (
            <Text>
              This vehicle was not updated or published because it has a validation error. Resolve the issue, then try
              again. Reason: <strong>{publishBlocker}</strong>.
            </Text>
          )}
          <Flex justify="flex-end" gap={2}>
            <Button
              text={publishBlocker ? 'Close' : 'Cancel'}
              mode="ghost"
              onClick={() => {
                setConfirmOpen(false)
                setPublishBlocker(null)
              }}
            />
            <Button
              text="Yes, mark as sold"
              tone="positive"
              disabled={Boolean(publishBlocker)}
              onClick={onConfirm}
            />
          </Flex>
        </Stack>
      ),
    },
  }
}

export default markAsSold


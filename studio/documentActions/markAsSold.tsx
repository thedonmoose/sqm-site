import {useCallback, useState} from 'react'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {useDocumentOperation} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

const markAsSold: DocumentActionComponent = (props: DocumentActionProps) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [publishBlocker, setPublishBlocker] = useState<string | null>(null)

  const doc = (props.draft ?? props.published) as {status?: string} | undefined
  const onConfirm = useCallback(() => {
    const publishDisabled = publish.disabled
    if (publishDisabled) {
      setPublishBlocker(
        typeof publishDisabled === 'string' ? publishDisabled : 'Publishing is currently unavailable.',
      )
    }
    patch.execute([
      {
        set: {
          status: 'sold',
          dateSold: new Date().toISOString().slice(0, 10),
        },
      },
    ])
    if (publishDisabled) {
      return
    }
    publish.execute()
    setConfirmOpen(false)
    props.onComplete()
  }, [patch, publish, props])

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
      onClose: () => setConfirmOpen(false),
      content: (
        <Stack gap={4} padding={4}>
          <Text>
            This sets the status to <strong>Sold</strong> and the date sold to today, then publishes the vehicle. It
            moves to the "Recently sold" section of the website on the next update, and you can still edit it
            afterwards.
          </Text>
          {publishBlocker && (
            <Text>
              The status was updated in the draft but not published. Reason: <strong>{publishBlocker}</strong>. Resolve
              the issue, then publish this vehicle manually.
            </Text>
          )}
          <Flex justify="flex-end" gap={2}>
            <Button
              text={publishBlocker ? 'Close' : 'Cancel'}
              mode="ghost"
              onClick={() => setConfirmOpen(false)}
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


import {useCallback, useState} from 'react'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {useDocumentOperation} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

const markAsAvailable: DocumentActionComponent = (props: DocumentActionProps) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const [publishBlocker, setPublishBlocker] = useState<string | null>(null)

  const doc = (props.draft ?? props.published) as {status?: string} | undefined
  const onHandle = useCallback(() => {
    const publishDisabled = publish.disabled
    if (publishDisabled) {
      setPublishBlocker(
        typeof publishDisabled === 'string' ? publishDisabled : 'Publishing is currently unavailable.',
      )
    }
    patch.execute([{set: {status: 'available'}}, {unset: ['dateSold']}])
    if (publishDisabled) {
      return
    }
    publish.execute()
    props.onComplete()
  }, [patch, publish, props])

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
          header: 'Vehicle updated but not published',
          onClose: () => {
            setPublishBlocker(null)
            props.onComplete()
          },
          content: (
            <Stack gap={4} padding={4}>
              <Text>
                The status was updated in the draft but not published. Reason: <strong>{publishBlocker}</strong>.
                Resolve the issue, then publish this vehicle manually.
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


import {useCallback, useRef} from 'react'
import {Button, Stack} from '@sanity/ui'
import {UploadIcon} from '@sanity/icons/Upload'
import {useSource} from 'sanity'
import type {ArrayOfObjectsInputProps} from 'sanity'

const DEFAULT_ASSET_SOURCE_NAME = 'sanity-default'

// Sanity's array input only uploads via drag-and-drop/paste; its own buttons never open a
// multi-file picker. This adds one and feeds the chosen files through the same `onSelectFile`
// path that drops use.
export function PhotosInput(props: ArrayOfObjectsInputProps) {
  const {onSelectFile, readOnly, renderDefault, schemaType} = props
  const {form} = useSource()
  const inputRef = useRef<HTMLInputElement>(null)

  const assetSource =
    form.image.assetSources.find((source) => source.name === DEFAULT_ASSET_SOURCE_NAME) ??
    form.image.assetSources.find((source) => source.Uploader)

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ''
      if (!assetSource || !onSelectFile) return
      for (const file of files) {
        onSelectFile({assetSource, schemaType: schemaType.of[0], file})
      }
    },
    [assetSource, onSelectFile, schemaType],
  )

  return (
    <Stack gap={3}>
      <Button
        icon={UploadIcon}
        text="Upload photos"
        tone="primary"
        mode="ghost"
        disabled={readOnly || !assetSource || !onSelectFile}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleChange}
      />
      {renderDefault(props)}
    </Stack>
  )
}

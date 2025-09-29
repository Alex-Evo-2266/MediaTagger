import { Avatar } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Image64 } from 'src/preload/types'

interface PreviewProps {
  name: string
}

export const Preview: React.FC<PreviewProps> = ({ name }) => {
  const [dataUrl, setDataUrl] = useState<string>('')

  const load = useCallback(() => {
    window.api.getImage(name).then((res: Image64 | null) => {
      if (res) setDataUrl(res?.base64)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return <Avatar variant="square" src={dataUrl} alt={name} sx={{ width: 64, height: 64 }} />
}

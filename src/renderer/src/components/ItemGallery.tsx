import { Box, Card, CardActionArea, CardMedia } from '@mui/material'
import { useEffect, useState } from 'react'
import { Image } from 'src/preload/types'

const SUPPORTED_EXTENSIONS = /\.(png|jpg|jpeg|gif|bmp|mp4|avi|mov)$/i

interface IContent {
  file: Image
  onClick: () => void
}

export const Content: React.FC<IContent> = ({ file, onClick }) => {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    // Загружаем файл только если поддерживается
    if (SUPPORTED_EXTENSIONS.test(file.fullPath)) {
      window.api.readFileAsBase64(file.fullPath).then(setDataUrl)
    }
  }, [file])

  const ext = file.fullPath.split('.').pop()?.toLowerCase() || ''
  const isVideo = /\.(mp4|avi|mov)$/i.test(file.fullPath)
  const isImage = /\.(png|jpg|jpeg|gif|bmp)$/i.test(file.fullPath)
  const unsupported = !isImage && !isVideo

  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        height: 200,
        minWidth: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: unsupported ? 'grey.300' : 'inherit'
      }}
    >
      <CardActionArea onClick={onClick}>
        {unsupported ? (
          <Box textAlign="center" px={1}>
            Неподдерживаемый формат: {ext}
          </Box>
        ) : isVideo ? (
          <CardMedia component="video" src={dataUrl} controls height="200" />
        ) : (
          <CardMedia component="img" src={dataUrl} alt="media" height="200" />
        )}
      </CardActionArea>
    </Card>
  )
}

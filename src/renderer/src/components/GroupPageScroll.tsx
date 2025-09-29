import { Box, Button } from '@mui/material'
import { useEffect, useState } from 'react'
import { Image64 } from 'src/preload/types'

interface GroupPageScrollProps {
  groupName: string
  onBack: () => void
}

export const GroupPageScroll: React.FC<GroupPageScrollProps> = ({ groupName, onBack }) => {
  const [images, setImages] = useState<Image64[]>([])

  useEffect(() => {
    window.api.getGroup(groupName).then((res) => {
      setImages(res)
    })
  }, [groupName])

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Button onClick={onBack}>Назад</Button>
      <h2>Группа: {groupName}</h2>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {images.map((img) => (
          <Box
            key={img.name}
            sx={{
              width: '100%',
              maxWidth: 800, // ограничение ширины
              mb: 1
            }}
          >
            <img
              key={img.name}
              src={img.base64}
              alt={img.name}
              style={{
                width: '100%', // одинаковая ширина
                height: 'auto', // пропорциональная высота
                display: 'block' // убирает зазоры как у inline-элементов
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

import CloseIcon from '@mui/icons-material/Close'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import { Dialog, IconButton, Box } from '@mui/material'
import React, { useState } from 'react'

interface ImageLightboxProps {
  open: boolean
  imageSrc: string
  onClose: () => void
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ open, imageSrc, onClose }) => {
  const [zoom, setZoom] = useState(1)

  const handleZoomIn = (): void => setZoom((z) => Math.min(z + 0.2, 5))
  const handleZoomOut = (): void => setZoom((z) => Math.max(z - 0.2, 1))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <Box
        position="relative"
        bgcolor="black"
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        overflow="auto"
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 10 }}
        >
          <CloseIcon />
        </IconButton>

        <IconButton
          onClick={handleZoomIn}
          sx={{ position: 'absolute', top: 8, left: 8, color: 'white', zIndex: 10 }}
        >
          <ZoomInIcon />
        </IconButton>

        <IconButton
          onClick={handleZoomOut}
          sx={{ position: 'absolute', top: 8, left: 50, color: 'white', zIndex: 10 }}
        >
          <ZoomOutIcon />
        </IconButton>

        <Box
          component="img"
          src={imageSrc}
          alt="zoomed"
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease-in-out',
            cursor: zoom > 1 ? 'grab' : 'zoom-in'
          }}
        />
      </Box>
    </Dialog>
  )
}

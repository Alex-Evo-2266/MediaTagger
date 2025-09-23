import { createTheme, ThemeProvider } from '@mui/material'
import { JSX, useEffect, useState } from 'react'

import Gallery from './components/Gallery'
import GalleryNoTag from './components/GalleryNoTag'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
      paper: '#121212'
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa'
    }
  }
})

function App(): JSX.Element {
  const [noTagPage, setNoTagPage] = useState(false)

  useEffect(() => {
    window.api.onToggleNoImageView((enabled) => {
      setNoTagPage(enabled)
    })
  }, [])

  return (
    <ThemeProvider theme={darkTheme}>{noTagPage ? <GalleryNoTag /> : <Gallery />}</ThemeProvider>
  )
}

export default App

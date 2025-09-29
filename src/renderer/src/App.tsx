import { createTheme, ThemeProvider } from '@mui/material'
import { JSX, useEffect, useState } from 'react'

import Gallery from './components/Gallery'
import GalleryNoTag from './components/GalleryNoTag'
import GalleryWithGroup from './components/GalleryWithGroup'
import GroupsTable from './components/Groups'

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
  const [page, setPage] = useState('withGroup')

  useEffect(() => {
    window.api.onNavigate((page) => {
      setPage(page)
    })
  }, [])

  return (
    <ThemeProvider theme={darkTheme}>
      {page === 'notag' ? (
        <GalleryNoTag />
      ) : page === 'groups' ? (
        <GroupsTable />
      ) : page === 'withGroup' ? (
        <GalleryWithGroup />
      ) : page === 'all' ? (
        <Gallery />
      ) : (
        <GalleryWithGroup />
      )}
    </ThemeProvider>
  )
}

export default App

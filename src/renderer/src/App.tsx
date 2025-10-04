import { createTheme, ThemeProvider } from '@mui/material'
import { JSX, useEffect, useState } from 'react'

import GalleryNoTag from './components/GalleryNoTag'
import GroupsTable from './components/Groups'
import { AllTagsPage } from './components/AllTags'
import { Gallery } from './components/Gallery'
import { MenuContext } from './context'
import { GalleryWithGroup } from './components/GalleryWithGroup'

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
  const [tag, setTag] = useState<string[]>([])

  useEffect(() => {
    window.api.onNavigate((page) => {
      setPage(page)
    })
  }, [])

  const updateMenu = (label: string, tags?: string[]) => {
    setTag(tags ?? [])
    window.api.setMenuItem(label)
  }

  console.log(page, tag)

  return (
    <MenuContext.Provider value={{onChangeMenu: updateMenu}}>
      <ThemeProvider theme={darkTheme}>
        {page === 'notag' ? (
          <GalleryNoTag />
        ) : page === 'groups' ? (
          <GroupsTable />
        ) : page === 'withGroup' ? (
          <GalleryWithGroup initTag={tag} />
        ) : page === "tags" ? (
          <AllTagsPage/>
        ) : page === 'all' ? (
          <Gallery initTag={tag}/>
        ) : (
          <GalleryWithGroup initTag={tag} />
        )}
      </ThemeProvider>
    </MenuContext.Provider>
    
  )
}

export default App

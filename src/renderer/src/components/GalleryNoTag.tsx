import { Pagination, Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import { JSX, useCallback, useEffect, useState } from 'react'
import { Image } from 'src/preload/types'

import { ImageDialog } from './ImageDialog'
import { Content } from './ItemGallery'

export default function GalleryNoTag(): JSX.Element {
  const [page, setPage] = useState<number>(0)
  const [pages, setPages] = useState<number>(1)
  const [images, setImages] = useState<Image[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(() => {
    window.api.loadImageNoTag(page).then((res) => {
      console.log(res)
      setImages(res.imgs)
      setPages(res.pages)
    })
  }, [page])

  useEffect(() => {
    load()
    window.api.onTagsUpdated((updated) => {
      if (updated) load()
    })
  }, [load])

  return (
    <Box p={2} display="flex" flexDirection="column" height="100vh">
      {/* Прокручиваемая область */}
      <Box flex={1} overflow="auto" pr={1}>
        <Grid container spacing={2}>
          {images.map((file) => (
            <Grid key={file.name}>
              <Content file={file} onClick={() => setSelected(file.name)} />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination
          count={pages}
          page={page + 1}
          onChange={(_, p) => setPage(p - 1)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
      {/* Диалог с увеличенной картинкой и тегами */}
      <ImageDialog
        open={selected !== null}
        filter={{ filter: { tags: [] }, search: '' }}
        name={selected ?? ''}
        onClose={() => setSelected(null)}
        reload={load}
      />
    </Box>
  )
}

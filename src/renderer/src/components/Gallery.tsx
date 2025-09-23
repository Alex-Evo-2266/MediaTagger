import { Pagination, Box, TextField, Stack, Chip } from '@mui/material'
import Grid from '@mui/material/Grid'
import { JSX, useCallback, useEffect, useState } from 'react'
import { Image } from 'src/preload/types'

import { ImageDialog } from './ImageDialog'
import { Content } from './ItemGallery'

export default function Gallery(): JSX.Element {
  const [page, setPage] = useState<number>(0)
  const [pages, setPages] = useState<number>(1)
  const [images, setImages] = useState<Image[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])

  const load = useCallback((): void => {
    window.api.loadImage({ filter: { tags: tags }, search: search }, page).then((res) => {
      setImages(res.imgs)
      setPages(res.pages)
    })
  }, [page, tags, search])

  useEffect(() => {
    load()
    window.api.onTagsUpdated((updated) => {
      if (updated) load()
    })
  }, [load])

  // добавление тега
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value)
    window.api.loadImage({ filter: { tags: tags }, search: e.target.value }, page).then((res) => {
      setImages(res.imgs)
      setPages(res.pages)
    })
  }

  const handleDeleteTag = (tagToDelete: string): void => {
    setTags(tags.filter((tag) => tag !== tagToDelete))
  }

  return (
    <Box p={2} display="flex" flexDirection="column" height="100vh">
      {/* Поле для ввода тегов */}
      <Box mb={2}>
        <TextField
          label="Фильтр по тегам"
          variant="outlined"
          size="small"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          fullWidth
        />
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
          {tags.map((tag) => (
            <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} color="primary" />
          ))}
        </Stack>
      </Box>
      <Box mb={2}>
        <TextField
          label="Поиск"
          variant="outlined"
          size="small"
          value={search}
          onChange={handleSearchChange}
          fullWidth
        />
      </Box>

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
      {selected !== null && (
        <ImageDialog
          filter={{ filter: { tags: tags }, search: '' }}
          name={selected}
          onClose={() => setSelected(null)}
          reload={load}
        />
      )}
    </Box>
  )
}

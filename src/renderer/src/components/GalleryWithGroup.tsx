import {
  Pagination,
  Box,
  TextField,
  Stack,
  Chip,
  Typography,
  Card,
  CardContent
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { JSX, useCallback, useEffect, useState } from 'react'
import { GalleryItem, ImagesWithGroup } from 'src/preload/types'

import { ImageDialogWithGroup } from './ImageDialogWithGroup'
import { Content } from './ItemGallery'

export default function GalleryWithGroup(): JSX.Element {
  const [page, setPage] = useState<number>(0)
  const [pages, setPages] = useState<number>(1)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [selected, setSelected] = useState<[string, string?] | null>(null)
  const [tagInput, setTagInput] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])

  const load = useCallback(() => {
    window.api
      .loadImageWithGroup({ filter: { tags }, search }, page)
      .then((res: ImagesWithGroup) => {
        setItems(res.imgs)
        setPages(res.pages)
      })
  }, [page, tags, search])

  useEffect(() => {
    load()
    window.api.onTagsUpdated((updated) => {
      if (updated) load()
    })
  }, [load])

  // Добавление тега
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
  }

  const handleDeleteTag = (tagToDelete: string): void => {
    setTags(tags.filter((tag) => tag !== tagToDelete))
  }

  const tagClick = (tag: string): void => {
    setSearch('')
    setTags([tag])
    setSelected(null)
  }

  const handleItemClick = (item: GalleryItem) => {
    if (item.type === 'group' && item.images.length > 0) {
      setSelected([item.images[0], item.name])
    } else if (item.type === 'image') {
      setSelected([item.name])
    }
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

      {/* Поле поиска */}
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

      {/* Галерея */}
      <Box flex={1} overflow="auto" pr={1}>
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid key={item.type === 'image' ? item.name : item.name}>
              {item.type === 'group' ? (
                <Card onClick={() => handleItemClick(item)} sx={{ cursor: 'pointer' }}>
                  {item.preview && (
                    <Content file={item.preview} onClick={() => {}} />
                    // <CardMedia component="img" height="140" image={item.preview.base64} alt={item.name} />
                  )}
                  <CardContent>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.images.length} изображений
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Content file={item} onClick={() => handleItemClick(item)} />
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Пагинация */}
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
      {selected && (
        <ImageDialogWithGroup
          open={selected !== null}
          filter={{ filter: { tags }, search: '' }}
          name={selected[0] ?? ''}
          group={selected[1]}
          onClose={() => setSelected(null)}
          reload={load}
          onTagClick={tagClick}
        />
      )}
    </Box>
  )
}

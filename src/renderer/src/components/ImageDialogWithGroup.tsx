import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  TextField,
  Stack,
  Chip,
  IconButton,
  DialogContentText,
  Snackbar,
  Alert,
  Autocomplete
} from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import { Filter, Image64WithGroup } from 'src/preload/types'

import { ConfirmDialog } from './Confirm'
import { ImageLightbox } from './ImageLightbox'
import { getValueIfStarts } from '@renderer/utils'
import { colors, groupColor } from '@renderer/tagColor'

interface IImageDialog {
  name: string
  group?: string
  onClose: () => void
  filter: Filter
  reload: () => void
  onTagClick?: (tag: string) => void
  open: boolean
}

export const ImageDialogWithGroup: React.FC<IImageDialog> = ({
  name,
  onClose,
  filter,
  reload,
  onTagClick,
  open,
  group
}) => {
  const [currentImgName, setCurrentImgName] = useState<[string, string?]>([name, group])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [editing, setEditing] = useState(false)
  const [order, setOrder] = useState<string | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [file, setFile] = useState<Image64WithGroup | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [groups, setGroups] = useState<string[]>([])

  // Для диалога переименования
  const [groupName, setGroupName] = useState('')
  const [selectGroup, setSelectGroup] = useState(false)

  const load = useCallback(() => {
    window.api.getImageWithGroup(currentImgName, filter).then((res: Image64WithGroup | null) => {
      console.log(res)
      setFile(res)
      setOrder(res?.order ?? null)
      setTags(res?.tags ?? [])
    })
  }, [currentImgName, filter])

  const loadGroups = useCallback(async() => {
    const data = await window.api.getGroupsByImage(currentImgName[0])
    setGroups(data)
  }, [currentImgName])

  useEffect(() => {
    load()
    loadGroups()
  }, [load, loadGroups])



  useEffect(() => {
    setCurrentImgName([name, group])
  }, [name, group])

  const handlePrev = (): void => {
    if (file?.prev) setCurrentImgName(file.prev)
  }

  const handleNext = (): void => {
    if (file?.next) setCurrentImgName(file.next)
  }

  useEffect(() => {
    const value = tagInput.trim()

    if (!value) {
      setTagSuggestions([])
      return
    }

    window.api.getTagSuggestions(value, 10).then((res) => setTagSuggestions(res))
  }, [tagInput])

  const handleAddTag = async (value?: string): Promise<void> => {
    const nextValue = (value ?? tagInput).trim()

    if (!nextValue) {
      return
    }

    const normalized = await window.api.normalizeTag(nextValue)

    if (normalized && !tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setTags((prev) => [...prev, normalized])
    }

    setTagInput('')
    setTagSuggestions([])
  }

  const handleDeleteTag = (tagToDelete: string): void => {
    setTags(tags.filter((t) => t !== tagToDelete))
  }

  const handleSave = (): void => {
    if (file) {
      window.api.saveTags(file.name, tags, order ?? undefined).then(() => {
        setEditing(false)
        reload()
        setAlert('teg seve')
      })
    }
  }

  const handleDeleteImage = (): void => {
    if (file) {
      window.api.deleteImg(file.name).then(() => {
        reload()
        if (file.next) {
          setCurrentImgName(file.next)
        } else if (file.prev) {
          setCurrentImgName(file.prev)
        } else {
          onClose()
        }
      })
    }
  }

  const handleCopy = (): void => {
    const text = JSON.stringify(tags)
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Теги скопированы:', text)
      })
      .catch((err) => {
        console.error('Ошибка копирования:', err)
      })
  }

  function clipboardTag(): void {
    navigator.clipboard
      .readText()
      .then((text) => {
        const parsed = JSON.parse(text)

        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          setTags((prev) => {
            const merged = [...prev, ...parsed]
            return Array.from(new Set(merged))
          })
        } else {
          console.error(parsed)
        }
      })
      .catch((er) => console.error(er))
  }

  const handleAddinGroup = (): void => {
    if (file) {
      window.api.addImageInGroup(groupName, file.name)
      setSelectGroup(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Изображение {file?.name}</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <IconButton onClick={handlePrev} disabled={!file?.prev}>
              <ArrowBackIosNewIcon />
            </IconButton>

            {file && (
              <Box
                component="img"
                src={file.base64}
                alt="preview"
                maxHeight="60vh"
                maxWidth="90%"
                onClick={() => setLightboxOpen(true)}
              />
            )}

            <IconButton onClick={handleNext} disabled={!file?.next}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
            {groups.map((tag) => (
              <Chip
                key={tag}
                sx={{color: groupColor, borderColor: groupColor}}
                label={tag}
                onDelete={editing ? () => handleDeleteTag(tag) : undefined}
                onClick={!editing && onTagClick ? () => onTagClick(tag) : undefined}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>

          <DialogContentText>путь {file?.path}</DialogContentText>

          {/* Теги */}
          <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                sx={{color: getValueIfStarts(colors, tag) as string, borderColor: getValueIfStarts(colors, tag) as string}}
                label={tag}
                onDelete={editing ? () => handleDeleteTag(tag) : undefined}
                onClick={!editing && onTagClick ? () => onTagClick(tag) : undefined}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>

          {editing && (
            <Box display="flex" gap={1} mb={2}>
              <Autocomplete
                freeSolo
                disablePortal
                options={tagSuggestions}
                inputValue={tagInput}
                onInputChange={(_, value) => setTagInput(value)}
                onChange={(_, value) => {
                  if (typeof value === 'string' && value.trim()) {
                    void handleAddTag(value)
                  }
                }}
                filterOptions={(options) => options}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Добавить тег"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void handleAddTag(tagInput)
                      }
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={() => void handleAddTag(tagInput)}>
                Добавить
              </Button>
              <Button variant="outlined" onClick={handleCopy}>
                Копировать
              </Button>
              <Button variant="outlined" onClick={clipboardTag}>
                Вставить
              </Button>
            </Box>
          )}

          {editing && (
            <Box display="flex" gap={1} mb={2}>
              <Button onClick={() => setSelectGroup(true)}>добавить в группу</Button>
            </Box>
          )}

          <Box display="flex" justifyContent="flex-end" gap={1} mb={1}>
            {!editing && (
              <Button variant="outlined" onClick={() => setEditing(true)}>
                Настройка тегов
              </Button>
            )}
            {editing && (
              <>
                <Button onClick={() => setEditing(false)}>Отмена</Button>
                <Button variant="contained" onClick={handleSave}>
                  Сохранить
                </Button>
                <ConfirmDialog
                  color="error"
                  text="Удалить изображение безвозвратно?"
                  textButton="Удалить"
                  onConfirm={handleDeleteImage}
                />
              </>
            )}
            <Button onClick={onClose}>Закрыть</Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={selectGroup} onClose={() => setSelectGroup(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Выбор группы</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1} mt={1}>
            <TextField
              fullWidth
              label="группы"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Button variant="outlined" onClick={handleAddinGroup}>
              Добавить
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={alert !== null} autoHideDuration={3000} onClose={() => setAlert(null)}>
        <Alert onClose={() => setAlert(null)} severity="info" sx={{ width: '100%' }}>
          {alert}
        </Alert>
      </Snackbar>

      <ImageLightbox
        open={lightboxOpen}
        imageSrc={file?.base64 || ''}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}

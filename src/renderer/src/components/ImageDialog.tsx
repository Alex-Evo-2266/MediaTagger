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
  Alert
} from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import { Filter, Image64 } from 'src/preload/types'

import { ConfirmDialog } from './Confirm'
import { ImageLightbox } from './ImageLightbox'

interface IImageDialog {
  name: string
  onClose: () => void
  filter: Filter
  reload: () => void
  onTagClick?: (tag: string) => void
  open: boolean
}

export const ImageDialog: React.FC<IImageDialog> = ({
  name,
  onClose,
  filter,
  reload,
  onTagClick,
  open
}) => {
  const [currentImgName, setCurrentImgName] = useState(name)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [order, setOrder] = useState<string | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [file, setFile] = useState<Image64 | null>(null)

  // Для диалога переименования
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameInput, setRenameInput] = useState('')
  const [groupName, setGroupName] = useState('')
  const [selectGroup, setSelectGroup] = useState(false)

  const [lightboxOpen, setLightboxOpen] = useState(false)

  const load = useCallback(() => {
    window.api.getImage(currentImgName, filter).then((res: Image64 | null) => {
      console.log(res)
      setFile(res)
      setOrder(res?.order ?? null)
      setTags(res?.tags ?? [])
      setRenameInput(res?.name ?? '')
    })
  }, [currentImgName, filter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setCurrentImgName(name)
  }, [name])

  const handlePrev = (): void => {
    if (file?.prev) setCurrentImgName(file.prev)
  }

  const handleNext = (): void => {
    if (file?.next) setCurrentImgName(file.next)
  }

  const handleAddTag = (): void => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
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

  const handleRenameDisplay = (): void => {
    if (file && renameInput.trim() !== '') {
      window.api.renameImg(file.name, renameInput.trim()).then(() => {
        setRenameDialogOpen(false)
        load()
        reload()
      })
    }
  }

  const handleRenameFile = (): void => {
    if (file && renameInput.trim() !== '' && renameInput.trim() !== file.name) {
      window.api.renameImgFile(file.name, renameInput.trim()).then((success: boolean) => {
        if (success) {
          setCurrentImgName(renameInput.trim())
          setRenameDialogOpen(false)
          load()
          reload()
        } else {
          setAlert('Ошибка при переименовании файла')
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

  const handleAddinGroup = () => {
    if(file)
    {
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
                onClick={()=>setLightboxOpen(true)}
              />
            )}

            <IconButton onClick={handleNext} disabled={!file?.next}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>

          <DialogContentText>путь {file?.path}</DialogContentText>

          {/* Теги */}
          <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
            {tags.map((tag) => (
              <Chip
                key={tag}
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
              <TextField
                fullWidth
                label="Добавить тег"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button variant="contained" onClick={handleAddTag}>
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
              <Button onClick={()=>setSelectGroup(true)}>добавить в группу</Button>
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
            {/* Кнопка для открытия диалога переименования */}
            <Button variant="outlined" onClick={() => setRenameDialogOpen(true)}>
              Переименовать
            </Button>
            <Button onClick={onClose}>Закрыть</Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Диалог переименования */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Переименование изображения</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1} mt={1}>
            <TextField
              fullWidth
              label="Новое имя"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
            />
            <Button variant="outlined" onClick={handleRenameDisplay}>
              Поменять отображаемое
            </Button>
            <Button variant="contained" onClick={handleRenameFile}>
              Поменять файл
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectGroup}
        onClose={() => setSelectGroup(false)}
        maxWidth="sm"
        fullWidth
      >
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

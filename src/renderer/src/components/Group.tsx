import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Paper,
  Typography
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Image64 } from 'src/preload/types'

interface GroupPageProps {
  groupName: string
  onBack: () => void
}

export const GroupPage: React.FC<GroupPageProps> = ({ groupName, onBack }) => {
  const [images, setImages] = useState<Image64[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)

  useEffect(() => {
    window.api.getGroup(groupName).then((res) => setImages(res))
  }, [groupName])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    const reordered = Array.from(images)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setImages(reordered)
    window.api.reorderGroup(
      groupName,
      reordered.map((i) => i.name)
    )
  }

  const handleDeleteClick = (name: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setImageToDelete(name)
    setOpenDialog(true)
  }

  const cancelDelete = () => {
    setImageToDelete(null)
    setOpenDialog(false)
  }

  const handleDelete = useCallback(() => {
    if (imageToDelete) {
      window.api
        .deleteImageInGroup(groupName, imageToDelete)
        .then(() => window.api.getGroup(groupName))
        .then((res) => {
          setImages(res)
          cancelDelete()
        })
    }
  }, [imageToDelete, groupName])

  return (
    <Box sx={{ p: 2 }}>
      <Button onClick={onBack}>Назад</Button>
      <h2>Группа: {groupName}</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2,
                p: 1,
                width: '100%', // контейнер ограничен шириной экрана
                maxWidth: '100vw', // не растягивается дальше окна
                overflowX: 'auto', // включаем горизонтальный скролл
                whiteSpace: 'nowrap'
              }}
            >
              {images.map((img, index) => (
                <Draggable key={img.name} draggableId={img.name} index={index}>
                  {(provided) => (
                    <Paper
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        flex: '0 0 auto',
                        width: 250,
                        height: 250
                      }}
                      sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1
                      }}
                    >
                      <img
                        src={img.base64}
                        alt={img.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />

                      {/* Кнопка удаления */}
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: '#fff'
                        }}
                        onClick={(e) => handleDeleteClick(img.name, e)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>

                      {/* Подпись */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          width: '100%',
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          color: '#fff',
                          p: 0.5,
                          textAlign: 'center',
                          wordBreak: 'break-all'
                        }}
                      >
                        <Typography variant="body2">{img.name}</Typography>
                      </Box>
                    </Paper>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={openDialog} onClose={cancelDelete}>
        <DialogTitle>Подтвердите удаление из группы</DialogTitle>
        <DialogActions>
          <Button onClick={cancelDelete}>Отмена</Button>
          <Button color="error" onClick={handleDelete}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

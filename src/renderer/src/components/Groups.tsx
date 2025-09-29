import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { PlusOne } from '@mui/icons-material'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  IconButton,
  DialogContent,
  TextField
} from '@mui/material'
import { JSX, useCallback, useEffect, useState } from 'react'

import { GroupPage } from './Group'
import { GroupPageScroll } from './GroupPageScroll'
import { Preview } from './Prev'
import { AddImages } from './selectFiles'

export default function GroupsTable(): JSX.Element {
  const [sequences, setSequences] = useState<Record<string, string[]>>({})
  const [openDialog, setOpenDialog] = useState(false)
  const [sequenceToDelete, setSequenceToDelete] = useState<string | null>(null)
  const [selectGroup, setSelectGroup] = useState<string | null>(null)
  const [editGroup, seteditGroup] = useState<string | null>(null)
  const [addImagesDialog, setAddImagesDialog] = useState<string | null>(null)
  const [addGroupDialog, setAddGroupDialog] = useState<boolean>(false)
  const [newGroupName, setNewGroupName] = useState<string>('')
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null)

  const load = useCallback(() => {
    window.api.getGroups().then((res) => {
      setSequences(res)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDeleteClick = (name: string): void => {
    setSequenceToDelete(name)
    setOpenDialog(true)
  }

  const cancelDelete = (): void => {
    setSequenceToDelete(null)
    setOpenDialog(false)
  }

  const deleteSequence = useCallback(() => {
    if (sequenceToDelete) {
      window.api
        .deleteGroup(sequenceToDelete)
        .then(() => window.api.getGroups())
        .then((res) => {
          setSequences(res)
          cancelDelete()
        })
    }
  }, [sequenceToDelete])

  const handleAddGroup = (): void => {
    window.api.addImagesInGroup(newGroupName, []).then(() => {
      setAddGroupDialog(false)
      load()
    })
  }

  // --- DND reorder ---
  const onDragEnd = (result: DropResult): void => {
    if (!result.destination) return

    const entries = Object.entries(sequences)
    const [removed] = entries.splice(result.source.index, 1)
    entries.splice(result.destination.index, 0, removed)

    const newSequences = Object.fromEntries(entries)
    setSequences(newSequences)

    // вызов reorder API с массивом имён групп
    window.api.reorderGroup(entries.map(([name]) => name))
  }

  if (editGroup !== null)
    return <GroupPage groupName={editGroup} onBack={() => seteditGroup(null)} />

  if (selectGroup !== null)
    return <GroupPageScroll groupName={selectGroup} onBack={() => setSelectGroup(null)} />

  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Button onClick={() => setAddGroupDialog(true)}>Создать группу</Button>
      <TableContainer component={Paper} sx={{ width: '100%', height: '90%', overflow: 'auto' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="groups-droppable">
            {(provided) => (
              <Table stickyHeader {...provided.droppableProps} ref={provided.innerRef}>
                <TableHead>
                  <TableRow>
                    <TableCell>Превью</TableCell>
                    <TableCell>Название группы</TableCell>
                    <TableCell>Количество изображений</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(sequences).map(([name, images], index) => (
                    <Draggable key={name} draggableId={name} index={index}>
                      {(provided, snapshot) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          hover
                          sx={{
                            backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit',
                            cursor: 'grab'
                          }}
                          onClick={() => setSelectGroup(name)}
                        >
                          <TableCell>
                            {images.length > 0 ? (
                              <Preview name={images[0]} />
                            ) : (
                              <Avatar variant="square" sx={{ width: 64, height: 64 }}>
                                ?
                              </Avatar>
                            )}
                          </TableCell>
                          <TableCell sx={{ display: 'table-cell', alignItems: 'center', gap: 1 }}>
                            {name}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(name)
                                setCopiedGroup(name)
                                setTimeout(() => setCopiedGroup(null), 1000)
                              }}
                            >
                              {copiedGroup === name ? (
                                <CheckIcon fontSize="small" sx={{ color: 'green' }} />
                              ) : (
                                <ContentCopyIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>{images.length}</TableCell>
                          <TableCell>
                            <IconButton
                              color="default"
                              onClick={(e) => {
                                e.stopPropagation()
                                seteditGroup(name)
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="default"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAddImagesDialog(name)
                              }}
                            >
                              <PlusOne />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(name)
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </TableBody>
              </Table>
            )}
          </Droppable>
        </DragDropContext>
      </TableContainer>

      {/* Диалог удаления */}
      <Dialog open={openDialog} onClose={cancelDelete}>
        <DialogTitle>Подтвердите удаление группы</DialogTitle>
        <DialogActions>
          <Button onClick={cancelDelete}>Отмена</Button>
          <Button color="error" onClick={deleteSequence}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания */}
      <Dialog
        open={addGroupDialog}
        onClose={() => setAddGroupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Создание группы</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1} mt={1}>
            <TextField
              fullWidth
              label="группы"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <Button variant="outlined" onClick={handleAddGroup}>
              Создать
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Добавление изображений */}
      <AddImages
        onBack={() => setAddImagesDialog(null)}
        open={addImagesDialog !== null}
        groupName={addImagesDialog ?? ''}
        onReload={load}
      />
    </Box>
  )
}

import { useCallback, useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Preview } from "./Prev";
import { GroupPage } from "./Group";
import { GroupPageScroll } from "./GroupPageScroll";
import { AddImages } from "./selectFiles";
import { PlusOne } from "@mui/icons-material";


export default function GroupsTable() {
    const [sequences, setSequences] = useState<Record<string, string[]>>({});
    const [openDialog, setOpenDialog] = useState(false);
    const [sequenceToDelete, setSequenceToDelete] = useState<string | null>(null);
    const [selectGroup, setSelectGroup] = useState<string | null>(null) 
    const [editGroup, seteditGroup] = useState<string | null>(null) 
    const [addImagesDialog, setAddImagesDialog] = useState<string | null>(null) 

    const load = useCallback(()=>{
      window.api.getGroups().then(res=>{
        setSequences(res)
      })
    },[])

  useEffect(() => {
    load()
  }, [load]);

  const handleDeleteClick = (name: string) => {
    setSequenceToDelete(name);
    setOpenDialog(true);
  };

    const cancelDelete = () => {
        setSequenceToDelete(null);
        setOpenDialog(false);
    };

  const deleteSequence = useCallback(() => {
    if(sequenceToDelete)
    {
        window.api.deleteGroup(sequenceToDelete)
        .then(()=>window.api.getGroups())
        .then(res=>{
            setSequences(res)
            cancelDelete()
        })
    }
  },[sequenceToDelete])

  if(editGroup !== null)
    return <GroupPage groupName={editGroup} onBack={()=>seteditGroup(null)}/>

  if(selectGroup !== null)
    return <GroupPageScroll groupName={selectGroup} onBack={()=>setSelectGroup(null)}/>

  return (
    <Box sx={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <TableContainer component={Paper} sx={{ width: "100%", height: "100%", overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Превью</TableCell>
              <TableCell>Название группы</TableCell>
              <TableCell>Количество изображений</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(sequences).map(([name, images]) => (
              <TableRow key={name} hover onClick={() => setSelectGroup(name)}>
                <TableCell>
                  {images.length > 0 ? (
                    <Preview name={images[0]} />
                  ) : (
                    <Avatar variant="square" sx={{ width: 64, height: 64 }}>
                      ?
                    </Avatar>
                  )}
                </TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{images.length}</TableCell>
                <TableCell>
                  <IconButton
                    color="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      seteditGroup(name);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddImagesDialog(name);
                    }}
                  >
                    <PlusOne />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(name);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={cancelDelete}>
        <DialogTitle>Подтвердите удаление группы</DialogTitle>
        <DialogActions>
          <Button onClick={cancelDelete}>Отмена</Button>
          <Button color="error" onClick={deleteSequence}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <AddImages
        onBack={() => setAddImagesDialog(null)}
        open={addImagesDialog !== null}
        groupName={addImagesDialog ?? ""}
        onReload={load}
      />
    </Box>

  );
}

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
import { Preview } from "./Prev";
import { GroupPage } from "./Group";


export default function GroupsTable() {
    const [sequences, setSequences] = useState<Record<string, string[]>>({});
    const [openDialog, setOpenDialog] = useState(false);
    const [sequenceToDelete, setSequenceToDelete] = useState<string | null>(null);
    const [selectGroup, setSelectGroup] = useState<string | null>(null) 

  useEffect(() => {
    window.api.getGroups().then(res=>{
        setSequences(res)
    })
  }, []);

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

  if(selectGroup !== null)
    return <GroupPage groupName={selectGroup} onBack={()=>setSelectGroup(null)}/>

  return (
    <Box sx={{ width: "100vw"}}>
        <TableContainer component={Paper} sx={{width: "100%"}}>
        <Table>
            <TableHead>
            <TableRow>
                <TableCell>Превью</TableCell>
                <TableCell>Название группы</TableCell>
                <TableCell>Количество изображений</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {Object.entries(sequences).map(([name, images]) => (
                <TableRow key={name} hover onClick={()=>setSelectGroup(name)}>
                <TableCell>
                    {images.length > 0 ? (
                    <Preview name={images[0]}/>
                    ) : (
                    <Avatar variant="square" sx={{ width: 64, height: 64 }}>
                        ?
                    </Avatar>
                    )}
                </TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{images.length}</TableCell>
                <TableCell>
                  <IconButton color="error" onClick={() => handleDeleteClick(name)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>
        {/* Диалог подтверждения */}
      <Dialog open={openDialog} onClose={cancelDelete}>
        <DialogTitle>Подтвердите удаление группы</DialogTitle>
        <DialogActions>
          <Button onClick={cancelDelete}>Отмена</Button>
          <Button color="error" onClick={deleteSequence}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

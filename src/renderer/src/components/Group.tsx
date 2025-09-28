import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Dialog, DialogActions, DialogTitle, IconButton, Paper } from "@mui/material";
import { Image64 } from "src/preload/types";

interface GroupPageProps {
    groupName: string
    onBack: ()=>void
}

export const GroupPage:React.FC<GroupPageProps> = ({groupName, onBack}) => {
  const [images, setImages] = useState<Image64[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  useEffect(() => {
    window.api.getGroup(groupName).then(res=>{
        setImages(res)
    })
  }, [groupName]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setImages(reordered);

    window.api.reorderGroup(groupName, reordered.map(i=>i.name))
  };

  const handleDeleteClick = (name: string) => {
    setImageToDelete(name);
    setOpenDialog(true);
  };

   const cancelDelete = () => {
          setImageToDelete(null);
          setOpenDialog(false);
      };
  
    const handleDelete = useCallback(() => {
      if(imageToDelete)
      {
          window.api.deleteImageInGroup(groupName, imageToDelete)
          .then(()=>window.api.getGroup(groupName))
          .then(res=>{
              setImages(res)
              cancelDelete()
          })
      }
    },[imageToDelete, groupName])

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
                display: "flex",
                gap: 2,
                overflowX: "auto",
                p: 1,
              }}
            >
              {images.map((img, index) => (
                <Draggable key={img.name} draggableId={img.name} index={index}>
                  {(provided) => (
                    <Paper
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{
                        width: 150,
                        height: 150,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={img.base64}
                        alt={img.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                       <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          bgcolor: "#dd4444",
                          color: "#fff"
                        }}
                        onClick={() => handleDeleteClick(img.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
          <Button color="error" onClick={handleDelete}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

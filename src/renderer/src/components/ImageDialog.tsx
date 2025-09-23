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
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useState, useEffect, useCallback } from "react";
import { Image, Image64 } from "src/preload/types";

export const ImageDialog = ({
        name,
        page,
        open,
        onClose,
        pageSize,
        pages
    }: {
        name:string
        page: number;
        open: boolean;
        onClose: () => void;
        pageSize: number
        pages: number
    }) => {
  const [currentImgName, setCurrentImgName] = useState(name);
  const [pagecur, setPage] = useState(page);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<Image64 | null>(null);

//   const file = images[currentIndex];

  const load = useCallback(() => {
      window.api.getImage(currentImgName).then((res:Image64|null) => {
        setFile(res);
        setTags(res?.tags ?? [])
      });
    }, [currentImgName]);

  useEffect(() => {
    load();
  }, [load]);

//   useEffect(() => {
//     if (file) {
//       window.api.readFileAsBase64(file).then(setDataUrl);
//     //   window.api.loadTags(file).then((existing: string[]) => setTags(existing || []));
//       setEditing(false);
//       setTagInput("");
//     }
//   }, [file]);

//   const handlePrev = () => {
//     if (currentIndex > 0) setCurrentIndex(prev=>prev-1);
//     else{
//         if(pagecur > 0) {
//             setPage(prev=>prev-1)
//             setCurrentIndex(pageSize - 1)
//         }
//     }
//   };

//   const handleNext = () => {
//     if (currentIndex < pageSize - 1) setCurrentIndex(prev=>prev + 1);
//     else{
//         if(pagecur < pages - 1)
//         {
//             setPage(prev=>prev+1)
//             setCurrentIndex(0)
//         }
//     }
//   };

  const handleAddTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((t) => t !== tagToDelete));
  };

  const handleSave = () => {
    if (file) {
      window.api.saveTags(file.name, tags).then(() => {
        alert("Теги сохранены");
        setEditing(false);
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Редактирование изображения</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          {/* <IconButton onClick={handlePrev}>
            <ArrowBackIosNewIcon />
          </IconButton> */}

          {file && (
            <Box component="img" src={file.base64} alt="preview" maxHeight="60vh" maxWidth="80%" />
          )}

          {/* <IconButton onClick={handleNext}>
            <ArrowForwardIosIcon />
          </IconButton> */}
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={editing ? () => handleDeleteTag(tag) : undefined}
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
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button variant="contained" onClick={handleAddTag}>
              Добавить
            </Button>
          </Box>
        )}

        <Box display="flex" justifyContent="flex-end" gap={1}>
          {!editing && (
            <Button variant="outlined" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {editing && (
            <>
              <Button onClick={() => setEditing(false)}>Отмена</Button>
              <Button variant="contained" onClick={handleSave}>
                Сохранить
              </Button>
            </>
          )}
          <Button onClick={onClose}>Закрыть</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

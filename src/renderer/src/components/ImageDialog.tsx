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
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState, useEffect, useCallback } from "react";
import { Filter, Image64 } from "src/preload/types";

export const ImageDialog = ({
  name,
  onClose,
  filter,
  reload,
}: {
  name: string;
  onClose: () => void;
  filter: Filter;
  reload: () => void;
}) => {
  const [currentImgName, setCurrentImgName] = useState(name);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<Image64 | null>(null);

  // Для диалога переименования
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameInput, setRenameInput] = useState("");

  const load = useCallback(() => {
    window.api.getImage(currentImgName, filter).then((res: Image64 | null) => {
      setFile(res);
      setTags(res?.tags ?? []);
      setRenameInput(res?.name ?? "");
    });
  }, [currentImgName, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrev = () => {
    if (file?.prev) setCurrentImgName(file.prev);
  };

  const handleNext = () => {
    if (file?.next) setCurrentImgName(file.next);
  };

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
        reload();
      });
    }
  };

  const handleDeleteImage = () => {
    if (file) {
      if (confirm("Удалить изображение безвозвратно?")) {
        window.api.deleteImg(file.name).then(() => {
          alert("Изображение удалено");
          reload();
          if (file.next) {
            setCurrentImgName(file.next);
          } else if (file.prev) {
            setCurrentImgName(file.prev);
          } else {
            onClose();
          }
        });
      }
    }
  };

  const handleRenameDisplay = () => {
    if (file && renameInput.trim() !== "") {
      window.api.renameImg(file.name, renameInput.trim()).then(() => {
        alert("Имя обновлено (только отображаемое)");
        setRenameDialogOpen(false);
        load();
        reload();
      });
    }
  };

  const handleRenameFile = () => {
    if (file && renameInput.trim() !== "" && renameInput.trim() !== file.name) {
      window.api.renameImgFile(file.name, renameInput.trim()).then((success: boolean) => {
        if (success) {
          alert("Файл переименован");
          setCurrentImgName(renameInput.trim());
          setRenameDialogOpen(false);
          load();
          reload();
        } else {
          alert("Ошибка при переименовании файла");
        }
      });
    }
  };

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Изображение {file?.name}</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <IconButton onClick={handlePrev} disabled={!file?.prev}>
              <ArrowBackIosNewIcon />
            </IconButton>

            {file && (
              <Box component="img" src={file.base64} alt="preview" maxHeight="60vh" maxWidth="80%" />
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
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteImage}
                  disabled={!file}
                >
                  Удалить
                </Button>
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
    </>
  );
};

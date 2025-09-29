import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Pagination,
  ListItemAvatar,
  TextField,
} from "@mui/material";
import { Preview } from "./Prev";

interface AddImagesProps {
  groupName: string;
  onBack: () => void;
  open: boolean;
  onReload?: () => void;
}

export const AddImages: React.FC<AddImagesProps> = ({
  groupName,
  onBack,
  open,
  onReload,
}) => {
  const [page, setPage] = useState<number>(0);
  const [pages, setPages] = useState<number>(1);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");

  const load = useCallback((): void => {
    window.api
      .loadImage({ filter: { tags: [] }, search }, page)
      .then((res) => {
        setAllImages(res.imgs.map((i) => i.name));
        setPages(res.pages);
      })
      .then(() => window.api.getGroup(groupName))
      .then((res) => {
        setImages(res.map((i) => i.name));
      });
  }, [page, search, groupName]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelect = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleAddToGroup = async () => {
    if (selected.length > 0) {
      await window.api.addImagesInGroup(groupName, selected);
      setSelected([]);
      onReload?.();
      onBack();
    }
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", height: "100vh" }}>
      <Dialog open={open} onClose={onBack} fullWidth maxWidth="sm">
        <DialogTitle>Выберите изображения для добавления</DialogTitle>
        <DialogContent dividers>
          {/* Поиск */}
          <TextField
            fullWidth
            placeholder="Поиск..."
            value={search}
            onChange={(e) => {
              setPage(0); // при изменении поиска сбрасываем на первую страницу
              setSearch(e.target.value);
            }}
            sx={{ mb: 2 }}
          />

          {/* Список изображений */}
          <List>
            {allImages.map((name) => (
              <ListItem key={name} onClick={() => toggleSelect(name)}>
                <ListItemIcon>
                  {images.includes(name) ? (
                    <Checkbox checked disabled />
                  ) : (
                    <Checkbox checked={selected.includes(name)} />
                  )}
                </ListItemIcon>
                <ListItemAvatar>
                  <Preview name={name} />
                </ListItemAvatar>
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>

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
        </DialogContent>
        <DialogActions>
          <Button onClick={onBack}>Отмена</Button>
          <Button
            onClick={handleAddToGroup}
            disabled={selected.length === 0}
            variant="contained"
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

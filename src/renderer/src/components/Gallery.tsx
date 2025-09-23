import { Button, Pagination, Card, CardMedia, CardActionArea, Box, TextField, Stack, Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useCallback, useEffect, useState } from "react";
import { ImageDialog } from "./ImageDialog";
import { Image } from "src/preload/types";

export default function Gallery() {
  const [page, setPage] = useState<number>(0);
  const [pages, setPages] = useState<number>(1);
  const [images, setImages] = useState<Image[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);

  const load = useCallback(() => {
    window.api.loadImage({ filter: {tags:tags}, search: "" }, page).then((res) => {
      setImages(res.imgs);
      setPages(res.pages);
    });
  }, [page, tags]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddImage = () => {
    window.api.copyImage().then((res) => {
      if (res) {
        alert(`Изображение(я) добавлено`);
        load();
      }
    });
  };

  // добавление тега
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  return (
    <Box p={2} display="flex" flexDirection="column" height="100vh">
      <Button
        variant="contained"
        startIcon={<AddPhotoAlternateIcon />}
        onClick={handleAddImage}
        sx={{ mb: 2, alignSelf: "flex-start" }}
      >
        Добавить изображения
      </Button>

      {/* Поле для ввода тегов */}
      <Box mb={2}>
        <TextField
          label="Фильтр по тегам"
          variant="outlined"
          size="small"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          fullWidth
        />
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleDeleteTag(tag)}
              color="primary"
            />
          ))}
        </Stack>
      </Box>

      {/* Прокручиваемая область */}
      <Box flex={1} overflow="auto" pr={1}>
        <Grid container spacing={2}>
          {images.map((file) => (
            <Grid size={{xs: 6, sm: 4, md: 3, lg: 2}} key={file.name}>
              <Content file={file} onClick={() => setSelected(file.name)} />
            </Grid>
          ))}
        </Grid>
      </Box>

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
      {/* Диалог с увеличенной картинкой и тегами */}
      {
        selected !== null &&
        <ImageDialog
            filter={{ filter: {tags:tags}, search: "" }}
            name={selected}
            onClose={() => setSelected(null)}
        />
      }
      
    </Box>
  );
}

const Content = ({ file, onClick }: { file: Image, onClick: () => void  }) => {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    window.api.readFileAsBase64(file.fullPath).then(setDataUrl);
  }, [file]);

  if (dataUrl === "") return null;

  const isVideo = /\.(mp4|avi|mov)$/i.test(file.fullPath);

  return (
    <Card sx={{ borderRadius: 2, overflow: "hidden", height: 200 }}>
      <CardActionArea onClick={onClick}>
        {isVideo ? (
          <CardMedia component="video" src={dataUrl} controls height="200" />
        ) : (
          <CardMedia component="img" src={dataUrl} alt="media" height="200" />
        )}
      </CardActionArea>
    </Card>
  );
};

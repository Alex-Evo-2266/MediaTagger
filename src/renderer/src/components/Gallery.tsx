import { Pagination, Card, CardMedia, CardActionArea, Box, TextField, Stack, Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
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
      console.log(res)
    });
  }, [page, tags]);

  useEffect(() => {
    load();
    window.api.onTagsUpdated((updated) => {
      if (updated) load();
    });
  }, [load]);

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
            <Grid key={file.name}>
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
            reload={load}
        />
      }
      
    </Box>
  );
}
const SUPPORTED_EXTENSIONS = /\.(png|jpg|jpeg|gif|bmp|mp4|avi|mov)$/i;

const Content = ({ file, onClick }: { file: Image; onClick: () => void }) => {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    // Загружаем файл только если поддерживается
    if (SUPPORTED_EXTENSIONS.test(file.fullPath)) {
      window.api.readFileAsBase64(file.fullPath).then(setDataUrl);
    }
  }, [file]);

  const ext = file.fullPath.split(".").pop()?.toLowerCase() || "";
  const isVideo = /\.(mp4|avi|mov)$/i.test(file.fullPath);
  const isImage = /\.(png|jpg|jpeg|gif|bmp)$/i.test(file.fullPath);
  const unsupported = !isImage && !isVideo;

  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        height: 200,
        minWidth: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: unsupported ? "grey.300" : "inherit",
      }}
    >
      <CardActionArea onClick={onClick}>
        {unsupported ? (
          <Box textAlign="center" px={1}>
            Неподдерживаемый формат: {ext}
          </Box>
        ) : isVideo ? (
          <CardMedia component="video" src={dataUrl} controls height="200" />
        ) : (
          <CardMedia component="img" src={dataUrl} alt="media" height="200" />
        )}
      </CardActionArea>
    </Card>
  );
};
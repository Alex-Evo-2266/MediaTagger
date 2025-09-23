import { Button, Pagination, Card, CardMedia, CardActionArea, Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useCallback, useEffect, useState } from "react";
import { ImageDialog } from "./ImageDialog";

export default function Gallery() {
  const [page, setPage] = useState<number>(0);
  const [pages, setPages] = useState<number>(1);
  const [imgInPage, setImgInPage] = useState<number>(10);
  const [images, setImages] = useState<string[]>([]);
    const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(() => {
    window.api.loadImage({ filter: "", search: "" }, page).then((res) => {
      setImages(res.imgs);
      setPages(res.pages);
      setImgInPage(res.imgInPage)
    });
  }, [page]);

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

      {/* Прокручиваемая область */}
      <Box flex={1} overflow="auto" pr={1}>
        <Grid container spacing={2}>
          {images.map((file, index) => (
            <Grid size={{xs: 6, sm: 4, md: 3, lg: 2}} key={file}>
              <Content file={file} onClick={() => setSelected(index)} />
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
            selectedIndex={selected ?? 0}
            open={selected !== null}
            onClose={() => setSelected(null)}
            page={page}
            pages={pages}
            pageSize={imgInPage}
        />
      }
      
    </Box>
  );
}

const Content = ({ file, onClick }: { file: string, onClick: () => void  }) => {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    window.api.readFileAsBase64(file).then(setDataUrl);
  }, [file]);

  if (dataUrl === "") return null;

  const isVideo = /\.(mp4|avi|mov)$/i.test(file);

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
